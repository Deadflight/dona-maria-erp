import { z } from "zod"
import { UNIDAD_CONFIG, type TipoUnidad } from "@/lib/constants/unidad-config"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tipoUnidadValues = Object.keys(UNIDAD_CONFIG) as [TipoUnidad, ...TipoUnidad[]]

const isValidInteger = (val: number): boolean =>
  Number.isInteger(val) || Math.abs(val % 1) < Number.EPSILON

// ---------------------------------------------------------------------------
// Create Schema
// ---------------------------------------------------------------------------

export const productCreateSchema = z
  .object({
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
    stock_actual: z.coerce
      .number()
      .min(0, "No puede ser negativo")
      .multipleOf(0.01, "Máximo 2 decimales")
      .default(0),
    stock_minimo: z.coerce
      .number()
      .min(0, "No puede ser negativo")
      .multipleOf(0.01, "Máximo 2 decimales")
      .default(0),
    unidad_medida: z
      .string()
      .min(1, "La unidad de medida es requerida")
      .max(50, "Máximo 50 caracteres"),
    tipo_unidad: z
      .enum(tipoUnidadValues, { message: "Tipo de unidad inválido" })
      .default("unidad"),
    unidad_base: z
      .enum(["und", "kg", "m", "cm"], { message: "Unidad base inválida" })
      .default("und"),
    factor_conversion: z.coerce
      .number()
      .positive("Factor debe ser positivo")
      .default(1),
    codigo_barras: z
      .string()
      .max(50, "Máximo 50 caracteres")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const tipo = data.tipo_unidad

    // Unit products (discrete) must have integer stock
    if (tipo === "unidad") {
      if (!isValidInteger(data.stock_actual)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stock_actual"],
          message: "Debe ser un número entero",
        })
      }
      if (!isValidInteger(data.stock_minimo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stock_minimo"],
          message: "Debe ser un número entero",
        })
      }
    }
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
      .multipleOf(0.01, "Máximo 2 decimales")
      .optional(),
    stock_minimo: z.coerce
      .number()
      .min(0, "No puede ser negativo")
      .multipleOf(0.01, "Máximo 2 decimales")
      .optional(),
    unidad_medida: z
      .string()
      .min(1, "La unidad de medida es requerida")
      .max(50, "Máximo 50 caracteres")
      .optional(),
    tipo_unidad: z
      .enum(tipoUnidadValues, { message: "Tipo de unidad inválido" })
      .optional(),
    unidad_base: z
      .enum(["und", "kg", "m", "cm"], { message: "Unidad base inválida" })
      .optional(),
    factor_conversion: z.coerce
      .number()
      .positive("Factor debe ser positivo")
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
  .superRefine((data, ctx) => {
    const tipo = data.tipo_unidad

    // Only validate stock when tipo_unidad is explicitly provided in the update
    if (tipo === "unidad" && data.stock_actual !== undefined) {
      if (!isValidInteger(data.stock_actual)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stock_actual"],
          message: "Debe ser un número entero",
        })
      }
    }
    if (tipo === "unidad" && data.stock_minimo !== undefined) {
      if (!isValidInteger(data.stock_minimo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stock_minimo"],
          message: "Debe ser un número entero",
        })
      }
    }
  })

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
