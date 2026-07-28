import { z } from "zod"

// ---------------------------------------------------------------------------
// Close Day Schema
// ---------------------------------------------------------------------------

export const closeDaySchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  monto_fisico: z
    .number()
    .min(0, "El monto físico no puede ser negativo"),
  totales_json: z.record(z.string(), z.number()).optional(),
  observaciones: z.string().optional(),
})

export type CloseDayInput = z.infer<typeof closeDaySchema>

// ---------------------------------------------------------------------------
// Daily Summary Params
// ---------------------------------------------------------------------------

export const dailySummaryParams = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
})

export type DailySummaryParams = z.infer<typeof dailySummaryParams>
