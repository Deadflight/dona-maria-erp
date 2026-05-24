# ADR-002: Selección de Next.js App Router con Server Actions

## Estado
Aceptado

## Contexto
Se requiere un framework frontend y backend para construir el sistema web. Se evaluaron las siguientes opciones:

- **Next.js App Router + Server Actions**
- **Next.js Pages Router + API Routes**
- **Vite + React + API Routes separadas**
- **Remix**
- **Astro**

## Decisión
Se selecciona **Next.js 14+ con App Router y Server Actions** como arquitectura full-stack.

## Razones

### 1. Server Actions eliminan la necesidad de API Routes
Las Server Actions permiten ejecutar código del servidor directamente desde los componentes React, sin crear endpoints REST explícitos:

```typescript
// En lugar de crear /api/ventas y fetchear
// Server Action directa:
async function registrarVenta(data: VentaInput) {
  'use server'
  // Lógica directamente en el servidor
}
```

Esto reduce significativamente el código boilerplate.

### 2. Renderizado híbrido (SSR + client components)
- Página de login y dashboard: Server-Side Rendering (SEO y seguridad)
- Terminal POS: Client Components con interactividad inmediata
- Optimización automática de rendimiento

### 3. TypeScript nativo
- Next.js tiene soporte first-class para TypeScript
- Genera tipos automáticamente desde Supabase
- Mejor experiencia de desarrollo con autocompletado

### 4. Integración con Vercel
- Deploy gratuito con Free Tier
- Preview deployments por cada PR
- CDN global para assets estáticos

### 5. Componentes de UI pre-construidos
- shadcn/ui se integra perfectamente con Next.js App Router
- Tailwind CSS para estilos utilitarios
- Componentes accesibles sin dependencia de state management complejo

## Alternativas consideredas

### Next.js Pages Router + API Routes
- **Rechazado**: El patrón de API Routes requiere crear archivos separados para cada endpoint
- Server Actions son más directos y type-safe
- App Router es el futuro de Next.js (el equipo de Vercel ya no recomienda Pages Router para proyectos nuevos)

### Vite + React + API Routes separadas
- **Rechazado**: Require setup manual de backend
- Más archivos para mantener
- Mayor complejidad en el proyecto

### Remix
- **Rechazado**: curva de aprendizaje diferente
- Comunidad más pequeña que Next.js
- Menos documentación en español

### Astro
- **Rechazado**: Enfocado en sitios estáticos/content-first
- No es ideal para aplicaciones web interactivas con estado complejo

## Consecuencias

### Positivo
- Menos código boilerplate que API Routes tradicionales
- Type safety de extremo a extremo
- Mejor rendimiento por defecto (Server Components)
- Ecosistema maduro y amplia documentación

### Negativo
- Curva de aprendizaje para desarrolladores acostumbrados a REST API
- Requiere entender el modelo de renderizado (Server vs Client components)
- Debug de Server Actions puede ser menos intuitivo al inicio

## Estructura de carpetas adoptada

```
src/
├── app/              # App Router (páginas y layouts)
│   ├── (auth)/      # Grupo de rutas de autenticación
│   └── (dashboard)/ # Grupo de rutas protegidas
├── actions/         # Server Actions organizadas por dominio
│   ├── auth.ts
│   ├── inventario.ts
│   └── ventas.ts
├── components/       # Componentes React
└── lib/             # Utilidades y configuración
```