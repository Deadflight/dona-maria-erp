import { z } from "zod"

// ---------------------------------------------------------------------------
// Sale Create Schema
// ---------------------------------------------------------------------------

const saleItemSchema = z.object({
  producto_id: z.string().uuid("ID de producto inválido"),
  cantidad: z.coerce
    .number()
    .positive("La cantidad debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
  precio_venta: z.coerce
    .number()
    .positive("El precio de venta debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
})

export const saleCreateSchema = z
  .object({
    cliente_id: z.string().uuid("ID de cliente inválido").nullable().optional(),
    metodo_pago: z.enum(["efectivo", "transferencia", "credito"], {
      message: "Método de pago inválido",
    }),
    subtotal: z.coerce
      .number()
      .positive("El subtotal debe ser mayor a 0")
      .multipleOf(0.01),
    impuesto: z.coerce
      .number()
      .min(0, "El impuesto no puede ser negativo")
      .multipleOf(0.01),
    total: z.coerce
      .number()
      .positive("El total debe ser mayor a 0")
      .multipleOf(0.01),
    items: z
      .array(saleItemSchema)
      .min(1, "Debe agregar al menos un producto"),
  })
  .refine(
    (data) => {
      // For crédito payments, client is required
      if (data.metodo_pago === "credito" && !data.cliente_id) {
        return false
      }
      return true
    },
    {
      message: "Selecciona un cliente para venta a crédito",
      path: ["cliente_id"],
    },
  )
  .refine(
    (data) => {
      // Verify total matches sum of items
      const itemsTotal = data.items.reduce(
        (sum, item) => sum + item.cantidad * item.precio_venta,
        0,
      )
      return Math.abs(itemsTotal - data.total) < 0.02
    },
    {
      message: "El total no coincide con la suma de los productos",
      path: ["total"],
    },
  )

export type SaleCreateInput = z.infer<typeof saleCreateSchema>

export type SaleFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  data?: { venta_id: string; numero_factura: string }
}

// ---------------------------------------------------------------------------
// List Sales Schema (filters)
// ---------------------------------------------------------------------------

export const listSalesSchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  metodo_pago: z
    .enum(["efectivo", "pago_movil", "transferencia", "divisa", "mixto", "credito"])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type ListSalesParams = z.infer<typeof listSalesSchema>
