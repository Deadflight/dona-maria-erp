## Spec: A17 — Admin CRUD Productos

### Overview

Full administrative CRUD for product management with a categories reference table. Admin users can create, edit, and soft-delete products. All authenticated users can list and view products.

---

### 1. Functional Requirements

#### 1.1 Server Actions — Products

| ID | Requirement |
|----|-------------|
| FR-P01 | `listProductos(filters?)` returns paginated product list with search (nombre, sku), category filter, and active status filter |
| FR-P02 | `getProductoById(id)` returns a single product by UUID |
| FR-P03 | `createProducto(data)` inserts a new product after Zod validation. Admin-only. Returns `{ data: { id }, error }` |
| FR-P04 | `updateProducto(id, data)` updates an existing product after Zod validation. Admin-only. Returns `{ data, error }` |
| FR-P05 | `deleteProducto(id)` sets `activo=false` (soft-delete). Admin-only. Returns `{ data, error }` |
| FR-P06 | SKU is auto-generated as `PROD-YYYYMMDD-NNN` when not provided |

#### 1.2 Server Actions — Categories

| ID | Requirement |
|----|-------------|
| FR-C01 | `listCategorias()` returns all active categories `{ data: [{ id, nombre }], error }` |
| FR-C02 | `createCategoria(data)` inserts a new category. Admin-only. Returns `{ data, error }` |
| FR-C03 | `deleteCategoria(id)` soft-sets `activo=false`. Admin-only. Returns `{ data, error }` |

#### 1.3 Pages

| ID | Requirement |
|----|-------------|
| FR-PG01 | `/products` renders product list table with search bar, category dropdown filter, and pagination |
| FR-PG02 | `/products/new` renders create product form |
| FR-PG03 | `/products/[id]` renders edit product form, pre-filled with existing data |
| FR-PG04 | Product table columns: nombre, categoría, precio venta, stock, estado, acciones (edit/delete) |
| FR-PG05 | Create/edit form fields: nombre*, categoría*, SKU, descripción, precio venta, precio compra, stock actual, stock mínimo, unidad medida, código barras |
| FR-PG06 | Unidad de medida is a select with options: unidad, kg, g, m, cm, l, ml |

#### 1.4 Security

| ID | Requirement |
|----|-------------|
| FR-S01 | list/get operations: any authenticated user (admin, seller, viewer) |
| FR-S02 | create/update/delete operations: admin only |
| FR-S03 | Server-side role check as defense-in-depth (RLS is primary security layer) |

#### 1.5 Validation

| ID | Requirement |
|----|-------------|
| FR-V01 | Required fields: nombre (string, min 1), categoria (string, min 1) |
| FR-V02 | Optional fields: sku (string), descripcion (string), precio_venta (positive number), precio_compra (positive number), stock_actual (non-negative integer), stock_minimo (non-negative integer), unidad_medida (enum), codigo_barras (string) |
| FR-V03 | Validation errors returned as `{ errors: Record<string, string[]> }` |

---

### 2. Scenarios

#### 2.1 Product List

**ESC-L1**: Admin lists products — shows all active products with pagination
```
Given an authenticated admin user
When they visit /products
Then they see a table of active products with columns: nombre, categoría, precio venta, stock, estado, acciones
And pagination controls are visible
```

**ESC-L2**: Admin searches products by name
```
Given an admin on /products
When they type "cemento" in the search bar
Then the table filters to show only products matching "cemento" in nombre or sku
```

**ESC-L3**: Admin filters by category
```
Given an admin on /products
When they select "Materiales" from the category dropdown
Then the table shows only products in the "Materiales" category
```

**ESC-L4**: Seller lists products — same view, no action buttons
```
Given an authenticated seller user
When they visit /products
Then they see the product table
But they do NOT see edit/delete action buttons
```

#### 2.2 Create Product

**ESC-C1**: Admin creates product with required fields only
```
Given an admin on /products/new
When they fill nombre="Cemento Portland" and categoría="Materiales"
And submit the form
Then a new product is created with auto-generated SKU
And they are redirected to /products
```

**ESC-C2**: Admin creates product with all fields
```
Given an admin on /products/new
When they fill all fields including precio_venta, precio_compra, stock
And submit the form
Then a new product is created with all provided values
```

**ESC-C3**: Validation error on missing required field
```
Given an admin on /products/new
When they submit with empty nombre
Then a validation error is displayed for the nombre field
And no product is created
```

**ESC-C4**: Non-admin cannot access create form
```
Given a seller user
When they visit /products/new
Then they are redirected to /products or see an access denied message
```

#### 2.3 Edit Product

**ESC-E1**: Admin edits existing product
```
Given an admin on /products/[id]
When they change precio_venta from 25 to 30
And submit the form
Then the product is updated
And they are redirected to /products
```

**ESC-E2**: Form is pre-filled with existing data
```
Given an admin on /products/[id]
Then all form fields show the current product values
```

#### 2.4 Soft-Delete

**ESC-D1**: Admin soft-deletes a product
```
Given an admin on /products
When they click delete on a product
Then activo is set to false
And the product no longer appears in the default list
```

**ESC-D2**: Soft-deleted product is not hard-deleted
```
Given a product with activo=false
When an admin views the product list with "show all" filter
Then the product appears with estado "Inactivo"
```

#### 2.5 Categories

**ESC-CA1**: Admin sees category dropdown populated from categories table
```
Given an admin on /products/new
When the form loads
Then the categoría dropdown shows categories from the categorias table
```

**ESC-CA2**: Admin can create a new category
```
Given an admin
When they create a new category via server action
Then the category appears in the dropdown
```

---

### 3. Data Model

#### 3.1 Existing: `public.productos`
```sql
id uuid PK, sku text UNIQUE, nombre text NOT NULL, descripcion text,
categoria text NOT NULL, precio_venta numeric(12,2), precio_compra numeric(12,2),
stock_actual integer DEFAULT 0, stock_minimo integer DEFAULT 0,
unidad_medida text DEFAULT 'unidad', codigo_barras text, activo boolean DEFAULT true,
created_at timestamptz, updated_at timestamptz
```

**Note**: `categoria` stays as `text` — no FK constraint. Categories are a reference list for the UI dropdown.

#### 3.2 New: `public.categorias`
```sql
id uuid PK DEFAULT gen_random_uuid(),
nombre text NOT NULL UNIQUE,
activo boolean DEFAULT true,
created_at timestamptz DEFAULT now()
```

**RLS policies** (same pattern as productos):
- `admin_all_categorias` — admin ALL
- `authenticated_select_categorias` — any authenticated user SELECT

---

### 4. API Surface

#### 4.1 Products

```typescript
// List products with filters
listProductos(params?: {
  search?: string      // Search in nombre, sku
  categoria?: string   // Filter by category name
  showAll?: boolean    // Include inactive products (admin only)
  limit?: number       // Default: 20
  offset?: number
}): Promise<{ data: ProductListResult[] | null; total: number | null; error: string | null }>

// Get single product
getProductoById(id: string): Promise<{ data: Product | null; error: string | null }>

// Create product (admin only)
createProducto(data: {
  nombre: string
  categoria: string
  sku?: string
  descripcion?: string
  precio_venta?: number
  precio_compra?: number
  stock_actual?: number
  stock_minimo?: number
  unidad_medida?: string
  codigo_barras?: string
}): Promise<{ data: { id: string } | null; error: string | null }>

// Update product (admin only)
updateProducto(id: string, data: Partial<ProductInput>): Promise<{ data: Product | null; error: string | null }>

// Soft-delete product (admin only)
deleteProducto(id: string): Promise<{ data: null; error: string | null }>
```

#### 4.2 Categories

```typescript
// List active categories
listCategorias(): Promise<{ data: Category[] | null; error: string | null }>

// Create category (admin only)
createCategoria(data: { nombre: string }): Promise<{ data: { id: string } | null; error: string | null }>

// Soft-delete category (admin only)
deleteCategoria(id: string): Promise<{ data: null; error: string | null }>
```

---

### 5. UI Requirements

#### 5.1 Product List (`/products`)

```
┌─────────────────────────────────────────────────────┐
│ Productos                          [+ Nuevo Producto]│
├─────────────────────────────────────────────────────┤
│ [🔍 Buscar por nombre o SKU...]  [Categoría ▼]      │
├─────────────────────────────────────────────────────┤
│ Nombre      │ Categoría │ Precio │ Stock │ Estado   │
│ Cemento     │ Materiales│ $25.00 │  150  │ Activo   │
│ Clavo 2"    │ Herramientas│ $5.00│  500  │ Activo   │
├─────────────────────────────────────────────────────┤
│ ← Anterior  Página 1 de 5  Siguiente →              │
└─────────────────────────────────────────────────────┘
```

- Search bar: debounced input (300ms)
- Category dropdown: populated from `listCategorias()`
- Actions column: Edit (link to `/products/[id]`) + Delete (confirmation dialog)
- Seller/viewer: no actions column, no "Nuevo Producto" button

#### 5.2 Create/Edit Form (`/products/new`, `/products/[id]`)

```
┌─────────────────────────────────────────────────────┐
│ [← Volver]  Crear Producto / Editar Producto         │
├─────────────────────────────────────────────────────┤
│ Nombre *        [________________________]            │
│ Categoría *     [Materiales        ▼]                │
│ SKU             [PROD-20260722-001] (auto-gen)       │
│ Descripción     [________________________]            │
│ Precio Venta    [0.00]                               │
│ Precio Compra   [0.00]                               │
│ Stock Actual    [0]                                  │
│ Stock Mínimo    [0]                                  │
│ Unidad Medida   [unidad         ▼]                   │
│ Código Barras   [________________________]            │
├─────────────────────────────────────────────────────┤
│                              [Cancelar] [Guardar]     │
└─────────────────────────────────────────────────────┘
```

- Required fields marked with *
- SKU field is read-only when auto-generated
- Unidad Medida is a select: unidad, kg, g, m, cm, l, ml
- Cancel button navigates back to /products
- Form uses `useActionState` pattern (same as receipt form)

---

### 6. File Structure

```
lib/
  validations/productos.ts          ← Zod schemas
  supabase/actions/productos.ts     ← Server Actions
  supabase/actions/categorias.ts    ← Category Server Actions

app/(dashboard)/products/
  page.tsx                          ← List page (server component)
  new/page.tsx                      ← Create page
  [id]/page.tsx                     ← Edit page

components/productos/
  producto-lista.tsx                ← Client table component
  producto-form.tsx                 ← Client form component

tests/
  actions/productos.test.ts         ← Product action tests
  actions/categorias.test.ts        ← Category action tests
  app/dashboard/products/page.test.tsx  ← Page tests
```

---

### 7. Non-functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Product list loads in < 500ms for up to 1000 products |
| NFR-02 | Search is debounced at 300ms to avoid excessive queries |
| NFR-03 | Forms are accessible (labels, ARIA, keyboard navigation) |
| NFR-04 | All new code has 80%+ test coverage |
| NFR-05 | No new npm dependencies required |
