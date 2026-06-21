import { z } from "zod"

// ---------------------------------------------------------------------------
// Purchase Receipt Create Schema
// ---------------------------------------------------------------------------

export const receiptCreateSchema = z.object({
  proveedor_id: z.string().uuid("ID de proveedor inválido"),
  numero_recepcion: z.string().min(1, "Número de recepción requerido"),
  observaciones: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional(),
  items: z
    .array(
      z.object({
        producto_id: z.string().uuid("ID de producto inválido"),
        cantidad_recibida: z.coerce
          .number()
          .positive("La cantidad debe ser mayor a 0"),
        precio_compra: z.coerce
          .number()
          .positive("El precio de compra debe ser mayor a 0"),
      }),
    )
    .min(1, "Debe agregar al menos un producto"),
})

export type ReceiptFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  data?: { id: string }
}
