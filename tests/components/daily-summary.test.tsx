import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DailySummary } from "@/app/(dashboard)/daily-close/_components/daily-summary"

const summary = {
  fecha: "2026-09-03",
  methods: [{ metodo_pago: "efectivo", total: 1250, count: 1 }],
  cancelled: { total: 0, count: 0 },
  systemTotal: 1250,
  totalVES: null,
  rateContext: "incomplete" as const,
  totalTransactions: 1,
  averageTicket: 1250,
}

describe("DailySummary currency labels", () => {
  it("distinguishes USD totals from incomplete VES totals", () => {
    render(<DailySummary summary={summary} />)

    expect(screen.getByText("Total Ventas (USD)")).toBeInTheDocument()
    expect(screen.getAllByText("$1,250.00")).toHaveLength(3)
    expect(screen.getByText(/Conversión VES incompleta/)).toBeInTheDocument()
    expect(screen.getByText("Sin total VES completo")).toBeInTheDocument()
  })
})