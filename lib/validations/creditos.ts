import { z } from "zod"

// ---------------------------------------------------------------------------
// Abono Validation
// ---------------------------------------------------------------------------

// Metodo de pago for abonos mirrors the PaymentPanel options (decision 7);
// 'credito' is intentionally absent — an abono cannot be paid with more credit.
export const abonoSchema = z.object({
  credito_id: z.string().uuid("ID de crédito inválido"),
  monto: z.coerce
    .number()
    .positive("El monto del abono debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
  metodo_pago: z.enum(
    ["efectivo", "pago_movil", "transferencia", "divisa", "mixto"],
    { message: "Método de pago inválido" },
  ),
  referencia: z.string().optional().or(z.literal("")),
})

export type AbonoInput = z.infer<typeof abonoSchema>
