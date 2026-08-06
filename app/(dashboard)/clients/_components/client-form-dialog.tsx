"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import type { Database } from "@/types/database"
import { createClient, updateClient, type ClientFormState } from "@/lib/supabase/actions/clientes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type ClientRow = Database["public"]["Tables"]["clientes"]["Row"]

type Props = { mode: "create" | "edit"; client?: ClientRow; onClose: () => void }

function FieldError({ field, errors }: { field: string; errors?: Record<string, string[]> }) {
  const message = errors?.[field]?.join(", ")
  return message ? <p id={`${field}-error`} className="text-xs text-destructive" role="alert">{message}</p> : null
}

export function ClientFormDialog({ mode, client, onClose }: Props) {
  const action = mode === "create" ? createClient : updateClient
  const [state, formAction, isPending] = useActionState<ClientFormState, FormData>(action, {})
  const [open, setOpen] = useState(true)
  const isEdit = mode === "edit"

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Cliente actualizado" : "Cliente creado")
      onClose()
    }
  }, [isEdit, onClose, state.success])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) onClose()
    if (nextOpen) setOpen(true)
  }

  const fieldProps = (field: string) => ({
    "aria-invalid": Boolean(state.errors?.[field]) || undefined,
    "aria-describedby": state.errors?.[field] ? `${field}-error` : undefined,
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>{isEdit ? "Actualiza los datos comerciales del cliente." : "Registra un cliente para ventas y crédito."}</DialogDescription>
        </DialogHeader>
        {state.message && !state.success && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{state.message}</p>}
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={client?.id ?? ""} />}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required defaultValue={client?.nombre ?? ""} {...fieldProps("nombre")} />
            <FieldError field="nombre" errors={state.errors} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <select id="tipo" name="tipo" defaultValue={client?.tipo ?? "natural"} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" {...fieldProps("tipo")}>
                <option value="natural">Natural</option>
                <option value="juridico">Jurídico</option>
              </select>
              <FieldError field="tipo" errors={state.errors} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rif_cedula">RIF/Cédula</Label>
              <Input id="rif_cedula" name="rif_cedula" defaultValue={client?.rif_cedula ?? ""} {...fieldProps("rif_cedula")} />
              <FieldError field="rif_cedula" errors={state.errors} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" defaultValue={client?.telefono ?? ""} {...fieldProps("telefono")} />
              <FieldError field="telefono" errors={state.errors} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} {...fieldProps("email")} />
              <FieldError field="email" errors={state.errors} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea id="direccion" name="direccion" rows={3} defaultValue={client?.direccion ?? ""} {...fieldProps("direccion")} />
            <FieldError field="direccion" errors={state.errors} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="limite_credito">Límite de crédito</Label>
              <Input id="limite_credito" name="limite_credito" type="number" min="0" step="0.01" defaultValue={client?.limite_credito ?? "0"} {...fieldProps("limite_credito")} />
              <FieldError field="limite_credito" errors={state.errors} />
            </div>
            {isEdit && <div className="space-y-1.5">
              <Label htmlFor="saldo_actual">Saldo actual</Label>
              <Input id="saldo_actual" value={new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(client?.saldo_actual ?? 0)} readOnly aria-readonly="true" />
              <p className="text-xs text-muted-foreground">El saldo se actualiza desde contabilidad.</p>
            </div>}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
