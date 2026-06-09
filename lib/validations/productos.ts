import { z } from "zod"

// ---------------------------------------------------------------------------
// Create Schema
// ---------------------------------------------------------------------------

export const productCreateSchema = z.object({
  sku: z
    .string()
    .min(1, "El SKU es requerido")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9-]+$/, "Solo letras, números y guiones"),
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  descripcion: z
    .string()
    .max(1000, "Máximo 1000 caracteres")
    .nullable()
    .optional(),
  categoria: z
    .string()
    .min(1, "La categoría es requerida")
    .max(100, "Máximo 100 caracteres"),
  precio_venta: z.coerce.number().positive("Debe ser mayor a 0"),
  precio_compra: z.coerce
    .number()
    .positive("Debe ser mayor a 0")
    .nullable()
    .optional(),
  stock_actual: z.coerce.number().min(0, "No puede ser negativo").default(0),
  stock_minimo: z.coerce.number().min(0, "No puede ser negativo").default(0),
  unidad_medida: z
    .string()
    .min(1, "La unidad de medida es requerida")
    .max(50, "Máximo 50 caracteres"),
  codigo_barras: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .nullable()
    .optional(),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>

// ---------------------------------------------------------------------------
// Update Schema
// ── All fields optional. NO defaults (to avoid overwriting stock on partial
//    updates). At least one field is required via `.refine()`.
// ---------------------------------------------------------------------------

export const productUpdateSchema = z
  .object({
    sku: z
      .string()
      .min(1, "El SKU es requerido")
      .max(50, "Máximo 50 caracteres")
      .regex(/^[a-zA-Z0-9-]+$/, "Solo letras, números y guiones")
      .optional(),
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .max(200, "Máximo 200 caracteres")
      .optional(),
    descripcion: z
      .string()
      .max(1000, "Máximo 1000 caracteres")
      .nullable()
      .optional(),
    categoria: z
      .string()
      .min(1, "La categoría es requerida")
      .max(100, "Máximo 100 caracteres")
      .optional(),
    precio_venta: z.coerce
      .number()
      .positive("Debe ser mayor a 0")
      .optional(),
    precio_compra: z.coerce
      .number()
      .positive("Debe ser mayor a 0")
      .nullable()
      .optional(),
    stock_actual: z.coerce
      .number()
      .min(0, "No puede ser negativo")
      .optional(),
    stock_minimo: z.coerce
      .number()
      .min(0, "No puede ser negativo")
      .optional(),
    unidad_medida: z
      .string()
      .min(1, "La unidad de medida es requerida")
      .max(50, "Máximo 50 caracteres")
      .optional(),
    codigo_barras: z
      .string()
      .max(50, "Máximo 50 caracteres")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Debe proporcionar al menos un campo para actualizar" },
  )

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>

// ---------------------------------------------------------------------------
// Bulk Price Update Schema
// ---------------------------------------------------------------------------

export const bulkUpdatePricesSchema = z.object({
  ids: z.array(z.string().uuid(), {
    message: "Debe proporcionar al menos un ID válido",
  }).min(1, "Debe seleccionar al menos un producto"),
  porcentaje: z.coerce
    .number({ message: "El porcentaje debe ser un número" })
    .min(-99, "Mínimo -99%")
    .max(1000, "Máximo 1000%"),
})

export type BulkUpdatePricesInput = z.infer<typeof bulkUpdatePricesSchema>
