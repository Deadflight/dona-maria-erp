import { z } from "zod"

// ---------------------------------------------------------------------------
// Initial Stock Loader Schema
// ---------------------------------------------------------------------------

export const initialStockItemSchema = z.object({
  producto_id: z.string().uuid("ID de producto inválido"),
  cantidad: z.coerce
    .number({ message: "La cantidad debe ser un número" })
    .positive("La cantidad debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
  costo_unitario: z.coerce
    .number({ message: "El costo debe ser un número" })
    .positive("El costo debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
})

export const initialStockSchema = z.object({
  items: z
    .array(initialStockItemSchema)
    .min(1, "Debe seleccionar al menos un producto"),
})

export type InitialStockItem = z.infer<typeof initialStockItemSchema>
export type InitialStockInput = z.infer<typeof initialStockSchema>
