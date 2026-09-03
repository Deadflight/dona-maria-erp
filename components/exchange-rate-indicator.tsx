import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/money"

import type { ExchangeRateDisplay } from "@/lib/supabase/actions/tasas"

export type { ExchangeRateDisplay }

type ExchangeRateIndicatorProps = {
  rate: ExchangeRateDisplay
  className?: string
}

const sourceLabels: Record<string, string> = {
  api_bcv: "API BCV",
  api_dolarapi: "API DolarAPI",
  manual: "Manual",
  fallida: "Fallida",
}

export function ExchangeRateIndicator({
  rate,
  className,
}: ExchangeRateIndicatorProps) {
  const state = {
    current: {
      label: "Vigente",
      title: "Tasa USD/VES",
      Icon: CheckCircle2,
      color: "text-status-success",
    },
    stale: {
      label: "Tasa vencida",
      title: "Tasa USD/VES",
      Icon: AlertTriangle,
      color: "text-destructive",
    },
    unavailable: {
      label: "Tasa no disponible",
      title: "Tasa USD/VES",
      Icon: HelpCircle,
      color: "text-muted-foreground",
    },
  }[rate.status]

  const Icon = state.Icon
  const source = rate.fuente ? sourceLabels[rate.fuente] ?? rate.fuente : null

  return (
    <div
      role="status"
      className={cn("rounded-lg border bg-card px-3 py-2 text-sm", className)}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", state.color)} />
        <span className="font-medium">{state.title}</span>
        <span className={cn("text-xs font-medium", state.color)}>{state.label}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {rate.tasa !== null && rate.status !== "unavailable" ? (
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrency(rate.tasa)} / USD
          </span>
        ) : (
          <span>Sin tasa válida</span>
        )}
        {source && <span>Fuente: {source}</span>}
      </div>
    </div>
  )
}
