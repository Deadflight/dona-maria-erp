# Server Actions — Contrato de arquitectura

Este documento describe el contrato general de las Server Actions en el proyecto: cómo se estructuran, cómo autorizan, cómo validan y cómo mantienen la UI sincronizada. Es la guía de referencia para implementar o revisar una action nueva.

## Propósito

Las Server Actions son funciones que corren en el servidor y se invocan directamente desde componentes de React (formularios o event handlers). En este proyecto se usan para:

- Mantener la lógica de negocio y el acceso a Supabase **fuera del cliente**.
- Evitar exponer rutas REST propias: el cliente nunca toca Supabase directamente.
- Obtener la sesión desde las cookies de Next.js y aplicar el control de roles en cada acción.

Todas las acciones siguen una base común:

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { revalidatePath } from "next/cache"
```

- `"use server"` — marca el módulo como Server Actions.
- `createClient` — crea el cliente de Supabase server-side con las cookies de la sesión (`lib/supabase/server.ts`).
- `getSession` — devuelve la sesión y el rol del usuario autenticado.
- `revalidatePath` — invalida la caché de Next.js tras mutaciones para refrescar la UI.

## Patrones de acciones

Hay dos patrones según la operación sea de lectura o de escritura.

### Query actions (lectura)

Una acción de lectura devuelve `{ data: T | null; error: string | null }`. El flujo es siempre el mismo:

1. Auth check primero: `getSession()`, y si no hay sesión devuelve `error: "UNAUTHORIZED"`.
2. Crear el cliente Supabase.
3. Ejecutar la query.
4. Si falla, devolver `{ data: null, error: error.message }`; si tiene éxito, `{ data, error: null }`.

```typescript
export async function getProductById(id: string): Promise<{
  data: ProductRow | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
```

Cualquier rol autenticado (viewer+) puede ejecutar las query actions de productos.

### Mutation actions (escritura)

Una acción de mutación sigue el patrón `useActionState`: recibe el estado anterior y el `FormData` del formulario, y devuelve el nuevo estado. El flujo:

1. Auth check con rol: `requireWriteRole()` devuelve `{ error: "UNAUTHORIZED" }` sin sesión o `{ error: "FORBIDDEN" }` si el rol no es `admin` ni `seller`.
2. Validación Zod con `safeParse` + `flatten().fieldErrors`.
3. Insert/update en Supabase.
4. Manejo del código PG `23505` (SKU duplicado) como error de campo.
5. `revalidatePath("/products")` y respuesta de éxito.

```typescript
async function requireWriteRole(): Promise<{ error: string } | null> {
  const session = await getSession()
  if (!session.data) {
    return { error: "UNAUTHORIZED" }
  }
  if (session.data.role !== "admin" && session.data.role !== "seller") {
    return { error: "FORBIDDEN" }
  }
  return null
}

export async function createProduct(
  prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const roleError = await requireWriteRole()
  if (roleError) return { message: roleError.error }

  const validated = productCreateSchema.safeParse(
    Object.fromEntries(formData),
  )
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("productos")
    .insert({ ...validated.data, sku })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { errors: { sku: ["Ya existe un producto con ese SKU"] } }
    }
    return { message: error.message }
  }

  revalidatePath("/products")
  return { success: true, data: { id: data.id } }
}
```

Todas las mutaciones comparten el mismo tipo de estado:

```typescript
type ProductFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  data?: { id: string }
}
```

## Autorización

Los roles vienen de `lib/auth/types.ts`:

```typescript
export type Role = "admin" | "seller" | "viewer"
```

| Rol | Lectura | Escritura | Notas |
|-----|---------|-----------|-------|
| `viewer` | Sí | No | Solo query actions |
| `seller` | Sí | Sí | Vendedor; redirige a `/pos` al iniciar sesión |
| `admin` | Sí | Sí | Full access |

Las respuestas de error de autorización:

| Código | Cuándo |
|--------|--------|
| `UNAUTHORIZED` | No hay sesión activa (usuario no autenticado) |
| `FORBIDDEN` | Hay sesión pero el rol no tiene permiso (ej. `viewer` intentando mutar) |

En las query actions el auth check devuelve el error en `error`; en las mutation actions se devuelve dentro de `message` (ej. `{ message: "FORBIDDEN" }`).

## Manejo de errores

Hay tres capas de error, cada una con su propio canal en la respuesta:

| Capa | Canal de salida | Ejemplo |
|------|-----------------|---------|
| Validación Zod | `errors: Record<string, string[]>` | `{ errors: { precio_venta: ["Debe ser mayor a 0"] } }` |
| Auth / flujo interno | `message: string` | `{ message: "UNAUTHORIZED" }` |
| Base de datos | `message: string` (o `error.message`) | mensaje de Supabase |

Errores de validación: se generan con `safeParse` + `flatten().fieldErrors`, que agrupa los mensajes **por nombre de campo**. El componente puede renderizarlos junto a cada input.

Errores de base de datos: se propagan como `message` genérico. Los códigos PostgreSQL se mapean a errores de campo cuando son entendibles para el usuario:

| Código PG | Condición | Resultado |
|-----------|-----------|-----------|
| `23505` | Violación de unicidad | `{ errors: { sku: ["Ya existe un producto con ese SKU"] } }` |
| otros | Cualquier otro fallo | `{ message: error.message }` |

## Convención de nombres de campos

- **Base de datos**: columnas en `snake_case` y en español (`precio_venta`, `stock_actual`, `tipo_unidad`, `codigo_barra`).
- **Funciones**: nombres en `camelCase` en inglés (`listProducts`, `createProduct`, `getProductById`).
- **Schemas Zod**: usan exactamente los nombres de columna de la BD, porque se pasan directamente a `insert`/`update`.
- **Respuestas**: para mutaciones se usa inglés en las claves de contrato (`success`, `errors`, `message`); los errores de validación y mensajes visibles están en español.

## Revalidación

Después de cada mutación exitosa se llama `revalidatePath("/products")`.

Motivo: las páginas de Next.js usan Server Components y caché de datos; sin revalidar, la UI seguiría mostrando los datos anteriores (ej. un producto creado no aparecería en la lista). `revalidatePath` invalida la ruta afectada para que el siguiente render vuelva a consultar Supabase y refleje el cambio.

No se revalida en query actions: la lectura no modifica estado.
