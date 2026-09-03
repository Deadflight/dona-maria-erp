"use client"

import { useActionState, useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  registerAbono,
  type AbonoFormState,
  type CreditListItem,
} from "@/lib/supabase/actions/creditos"
import { formatCurrency } from "@/lib/money"
import { PriceWithExchangeRate } from "@/components/price-with-exchange-rate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Labels mirror the canonical PAYMENT_METHOD_LABELS in sales-table.tsx;
// "credito" is intentionally absent (decision 7).
const METODO_PAGO_OPTIONS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "pago_movil", label: "Pago Móvil" },
  { value: "transferencia", label: "Transferencia" },
  { value: "divisa", label: "Divisa" },
  { value: "mixto", label: "Mixto" },
]

type Props = { credit: CreditListItem; exchangeRate?: number | null; onClose: () => void }

function FieldError({
  field,
  errors,
}: {
  field: string
  errors?: Record<string, string[]>
}) {
  const message = errors?.[field]?.join(", ")
  return message ? (
    <p id={`${field}-error`} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null
}

export function AbonoDialog({ credit, exchangeRate = null, onClose }: Props) {
  const [state, formAction, isPending] = useActionState<
    AbonoFormState,
    FormData
  >(registerAbono, {})
  const [open, setOpen] = useState(true)
  const [overpaymentError, setOverpaymentError] = useState<string | null>(null)
  const [amount, setAmount] = useState("")

  useEffect(() => {
    if (state.success) {
      toast.success("Abono registrado")
      onClose()
    }
  }, [onClose, state.success])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) onClose()
    if (nextOpen) setOpen(true)
  }

  // Client-side overpayment guard (REQ-CREDITS-UI-2): the register_abono RPC
  // is authoritative, but blocking here avoids a round-trip for invalid input.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const monto = Number(new FormData(event.currentTarget).get("monto"))
    if (monto > credit.saldo_pendiente) {
      event.preventDefault()
      setOverpaymentError(
        `El monto no puede superar el saldo pendiente (${formatCurrency(credit.saldo_pendiente)}).`,
      )
      return
    }
    setOverpaymentError(null)
  }

  const fieldProps = (field: string) => ({
    "aria-invalid": Boolean(state.errors?.[field]) || undefined,
    "aria-describedby": state.errors?.[field] ? `${field}-error` : undefined,
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar abono</DialogTitle>
          <DialogDescription>
            Abono de <strong>{credit.clientes?.nombre ?? "el cliente"}</strong> —
            saldo pendiente {formatCurrency(credit.saldo_pendiente)}.
          </DialogDescription>
        </DialogHeader>
        {state.message && !state.success && (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.message}
          </p>
        )}
        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="credito_id" value={credit.id} />
          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto (USD)</Label>
            <Input
              id="monto"
              name="monto"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              {...fieldProps("monto")}
            />
            <FieldError field="monto" errors={state.errors} />
            {amount && Number(amount) > 0 && (
              <PriceWithExchangeRate amount={Number(amount)} exchangeRate={exchangeRate} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metodo_pago">Método de pago</Label>
            <select
              id="metodo_pago"
              name="metodo_pago"
              defaultValue="efectivo"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              {...fieldProps("metodo_pago")}
            >
              {METODO_PAGO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError field="metodo_pago" errors={state.errors} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="referencia">
              Referencia <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input id="referencia" name="referencia" {...fieldProps("referencia")} />
            <FieldError field="referencia" errors={state.errors} />
          </div>
          {overpaymentError && (
            <p className="text-xs text-destructive" role="alert">
              {overpaymentError}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Registrando..." : "Registrar abono"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
