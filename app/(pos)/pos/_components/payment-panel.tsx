"use client"

import { Banknote, CreditCard, ArrowRightLeft, DollarSign } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatUsd } from "@/lib/money"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = "efectivo" | "transferencia" | "credito"

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "transferencia", label: "Transferencia", icon: ArrowRightLeft },
  { value: "credito", label: "Crédito", icon: CreditCard },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type PaymentPanelProps = {
  total: number
  exchangeRate?: number | null
  paymentMethod: PaymentMethod | null
  clienteNombre: string | null
  clienteLimiteCredito: number | null
  clienteSaldoActual: number | null
  isCreditoOverLimit: boolean
  isCreditoWithoutClient: boolean
  isEmpty: boolean
  amountReceived: number | null
  change: number | null
  onSetPaymentMethod: (method: PaymentMethod) => void
  onSetAmountReceived: (amount: number | null) => void
  onSetAmountToExact: () => void
  onConfirm: () => void
  isSubmitting?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaymentPanel({
  total,
  exchangeRate = null,
  paymentMethod,
  clienteNombre,
  clienteLimiteCredito,
  clienteSaldoActual,
  isCreditoOverLimit,
  isCreditoWithoutClient,
  isEmpty,
  amountReceived,
  change,
  onSetPaymentMethod,
  onSetAmountReceived,
  onSetAmountToExact,
  onConfirm,
  isSubmitting = false,
  className,
}: PaymentPanelProps) {
  const canConfirm =
    !isEmpty &&
    paymentMethod !== null &&
    !isCreditoWithoutClient &&
    !(paymentMethod === "credito" && isCreditoOverLimit) &&
    !isSubmitting

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total USD</span>
          <span className="font-semibold tabular-nums">{formatUsd(total)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground">Total VES</span>
          <span className="font-semibold tabular-nums">
            {exchangeRate === null
              ? "Sin tasa disponible"
              : formatCurrency(total * exchangeRate)}
          </span>
        </div>
      </div>

      {/* Payment method selector */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Método de pago
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon
            const isActive = paymentMethod === pm.value
            return (
              <Button
                key={pm.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onSetPaymentMethod(pm.value)}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <Icon className="size-4" />
                <span className="text-xs">{pm.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Crédito warning */}
      {isCreditoWithoutClient && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Selecciona un cliente para venta a crédito
        </div>
      )}

      {/* Cash input */}
      {paymentMethod === "efectivo" && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recibido
          </p>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={amountReceived ?? ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                onSetAmountReceived(isNaN(val) ? null : val)
              }}
              placeholder="0.00"
              className="h-9 pl-8 text-sm tabular-nums"
            />
          </div>
          {change !== null && change >= 0 && (
            <p className="mt-1 text-sm font-semibold text-status-success">
              Cambio: ${change.toFixed(2)}
            </p>
          )}
          {change !== null && change < 0 && (
            <p className="mt-1 text-xs text-destructive">
              Faltan ${Math.abs(change).toFixed(2)}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSetAmountToExact}
            className="mt-2 w-full text-xs text-primary hover:text-primary"
            disabled={isEmpty}
          >
            <DollarSign className="mr-1 size-3" />
            Monto exacto — ${total.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Client info badge (for credito) */}
      {paymentMethod === "credito" && clienteNombre && (
        <div className="rounded-lg bg-muted px-3 py-2 text-xs">
          <span className="text-muted-foreground">Cliente: </span>
          <span className="font-medium">{clienteNombre}</span>
        </div>
      )}

      {/* Over-limit credit warning (CR4) */}
      {paymentMethod === "credito" && isCreditoOverLimit && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <p className="font-semibold">El cliente excede su límite de crédito</p>
          <p className="mt-1">
            Saldo actual: {formatCurrency(clienteSaldoActual ?? 0)} · Total:{" "}
            {formatCurrency(total)} · Límite: {formatCurrency(clienteLimiteCredito ?? 0)}
          </p>
        </div>
      )}

      {/* Confirm button */}
      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        size="lg"
        className="w-full text-sm font-bold"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Procesando...
          </span>
        ) : (
          <>
            Confirmar venta (F3) — ${total.toFixed(2)}
          </>
        )}
      </Button>
    </div>
  )
}
