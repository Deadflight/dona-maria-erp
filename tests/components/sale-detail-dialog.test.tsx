import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SaleDetailDialog } from "@/app/(dashboard)/sales/_components/sale-detail-dialog"
import type { SaleDetail } from "@/lib/supabase/actions/ventas"

function makeSale(conversion: Pick<SaleDetail, "tasa_cambio_usd_a_ves" | "total_ves">): SaleDetail {
  return {
    id: "sale-1",
    cliente_id: null,
    created_at: "2026-09-03T12:00:00.000Z",
    estado: "completada",
    impuesto: 0,
    metodo_pago: "efectivo",
    numero_factura: "VT-20260903-0001",
    observaciones: null,
    subtotal: 100,
    total: 100,
    vendedor_id: null,
    fuente_tasa: null,
    clientes: null,
    profiles: { full_name: "Seller" },
    detalles_venta: [],
    pagos_venta: [],
    ...conversion,
  }
}

describe("SaleDetailDialog exchange-rate context", () => {
  it("shows the persisted rate and VES total", () => {
    render(
      <SaleDetailDialog
        sale={makeSale({ tasa_cambio_usd_a_ves: 36.5, total_ves: 3650 })}
        open
        onOpenChange={() => {}}
      />,
    )

    expect(screen.getByText("Total VES:")).toBeInTheDocument()
    expect(screen.getByText("Tasa aplicada:")).toBeInTheDocument()
    expect(screen.getAllByText(/Bs\. 3\.650,00/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Bs\. 36,50 \/ USD/).length).toBeGreaterThan(0)
    expect(screen.getByText("Total USD:")).toBeInTheDocument()
  })

  it("marks legacy sales without conversion as unavailable", () => {
    render(
      <SaleDetailDialog
        sale={makeSale({ tasa_cambio_usd_a_ves: null, total_ves: null })}
        open
        onOpenChange={() => {}}
      />,
    )

    expect(screen.getAllByText("Sin tasa histórica")).toHaveLength(2)
  })
})
