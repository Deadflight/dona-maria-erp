"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { Package, TriangleAlert, DollarSign, Truck } from "lucide-react"
import type { ReactNode } from "react"
import { PriceWithExchangeRate } from "@/components/price-with-exchange-rate"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KpiCardsProps {
  totalProductos: number
  alertasStock: number
  valorInventario: number
  ultimasRecepciones: number
  exchangeRate?: number | null
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

export function KpiCards({
  totalProductos,
  alertasStock,
  valorInventario,
  ultimasRecepciones,
  exchangeRate = null,
}: KpiCardsProps) {
  const cards: Array<{ title: string; value: ReactNode; icon: typeof Package; iconClass: string }> = [
    {
      title: "Total Productos",
      value: formatNumber(totalProductos),
      icon: Package,
      iconClass: "text-muted-foreground",
    },
    {
      title: "Alertas de Stock",
      value: formatNumber(alertasStock),
      icon: TriangleAlert,
      iconClass: "text-destructive",
    },
    {
      title: "Valor del Inventario",
      value: <PriceWithExchangeRate amount={valorInventario} exchangeRate={exchangeRate} />,
      icon: DollarSign,
      iconClass: "text-muted-foreground",
    },
    {
      title: "Últimas Recepciones",
      value: formatNumber(ultimasRecepciones),
      icon: Truck,
      iconClass: "text-muted-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`size-5 ${card.iconClass}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
