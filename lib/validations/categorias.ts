import { z } from "zod"

export const categoriaCreateSchema = z.object({
  nombre: z
    .string()
    .min(1, "Nombre requerido")
    .max(100, "Máximo 100 caracteres"),
})

export type CategoriaCreateInput = z.infer<typeof categoriaCreateSchema>
