import { formatCurrency, formatUsd } from "@/lib/money"
import { cn } from "@/lib/utils"

type PriceWithExchangeRateProps = {
  amount: number
  exchangeRate: number | null
  className?: string
}

export function PriceWithExchangeRate({
  amount,
  exchangeRate,
  className,
}: PriceWithExchangeRateProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="font-medium tabular-nums">{formatUsd(amount)} USD</p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {exchangeRate === null
          ? "VES no disponible"
          : `${formatCurrency(Math.round(amount * exchangeRate * 100) / 100)} VES`}
      </p>
    </div>
  )
}
