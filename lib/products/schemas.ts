// Zod v4 validation schemas for Products
// Uses Zod v4 API: z.email(), z.optional(), z.nullable() top-level functions
import * as z from "zod"

export const ProductCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.optional(z.string().max(1000)),
  category: z.string().min(1, "Category is required").max(100),
  sku: z.string().min(1, "SKU is required").max(50),
  barcode: z.optional(z.string().max(50)),
  unit_type: z.enum(["unit", "weight", "length", "mixed"]).default("unit"),
  base_unit: z.enum(["kg", "g", "m", "cm", "unit"]).default("unit"),
  conversion_factor: z
    .number()
    .positive("Conversion factor must be positive")
    .default(1),
  price_usd: z.number().positive("Price must be positive"),
  cost_usd: z.optional(
    z.number().positive("Cost must be positive").nullable()
  ),
  current_stock: z.number().min(0, "Stock cannot be negative").default(0),
  min_stock: z.number().min(0, "Min stock cannot be negative").default(0),
})

export const ProductUpdateSchema = ProductCreateSchema.partial()

export const ProductSearchSchema = z.object({
  query: z.optional(z.string()),
  category: z.optional(z.string()),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
})
