import { z } from "zod"

// ---------------------------------------------------------------------------
// Client CRUD Validation
// ---------------------------------------------------------------------------

export const clientCreateSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  telefono: z
    .string()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  rif_cedula: z
    .string()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  tipo: z.enum(["natural", "juridico"]).default("natural"),
  limite_credito: z.coerce
    .number()
    .min(0, "El límite de crédito no puede ser negativo")
    .default(0),
})

export const clientUpdateSchema = clientCreateSchema.partial()

export type ClientCreateInput = z.infer<typeof clientCreateSchema>
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
