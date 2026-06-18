"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import Link from "next/link"
import { Package, ShoppingBag, TriangleAlert } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface NavCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navCards: NavCard[] = [
  {
    title: "Recepción de Mercancía",
    description: "Registrar entrada de productos al inventario",
    href: "/receipts",
    icon: Package,
  },
  {
    title: "Productos",
    description: "Gestionar catálogo de productos",
    href: "/products",
    icon: ShoppingBag,
  },
  {
    title: "Alertas de Stock",
    description: "Productos con stock por debajo del mínimo",
    href: "/inventory",
    icon: TriangleAlert,
  },
]

// ---------------------------------------------------------------------------
// Quick Navigation
// ---------------------------------------------------------------------------

export function QuickNav() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {navCards.map((card) => {
        const Icon = card.icon
        return (
          <Link key={card.title} href={card.href}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
