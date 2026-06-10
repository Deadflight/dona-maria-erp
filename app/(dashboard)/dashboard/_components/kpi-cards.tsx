"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { Package, TriangleAlert, DollarSign, Truck } from "lucide-react"

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KpiCardsProps {
  totalProductos: number
  alertasStock: number
  valorInventario: number
  ultimasRecepciones: number
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

export function KpiCards({
  totalProductos,
  alertasStock,
  valorInventario,
  ultimasRecepciones,
}: KpiCardsProps) {
  const cards = [
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
      value: formatCurrency(valorInventario),
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
              <p className="text-2xl font-bold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
