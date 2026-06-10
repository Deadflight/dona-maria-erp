import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { KpiCards } from "@/app/(dashboard)/dashboard/_components/kpi-cards"

describe("KpiCards", () => {
  const defaultProps = {
    totalProductos: 150,
    alertasStock: 12,
    valorInventario: 450_000.5,
    ultimasRecepciones: 5,
  }

  it("renders all 4 KPI cards with titles", () => {
    render(<KpiCards {...defaultProps} />)

    expect(screen.getByText("Total Productos")).toBeInTheDocument()
    expect(screen.getByText("Alertas de Stock")).toBeInTheDocument()
    expect(screen.getByText("Valor del Inventario")).toBeInTheDocument()
    expect(screen.getByText("Últimas Recepciones")).toBeInTheDocument()
  })

  it("displays correct formatted values", () => {
    render(<KpiCards {...defaultProps} />)

    // formatNumber(150) → "150" (es-MX)
    expect(screen.getByText("150")).toBeInTheDocument()
    // formatNumber(12) → "12" (es-MX)
    expect(screen.getByText("12")).toBeInTheDocument()
    // formatCurrency(450000.50) → "$450,000.50" (es-MX, MXN)
    expect(screen.getByText("$450,000.50")).toBeInTheDocument()
    // formatNumber(5) → "5" (es-MX)
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("formats numbers with thousands separator and currency", () => {
    render(
      <KpiCards
        totalProductos={2_500}
        alertasStock={0}
        valorInventario={1_234_567.89}
        ultimasRecepciones={0}
      />,
    )

    // formatNumber(2500) → "2,500" (es-MX)
    expect(screen.getByText("2,500")).toBeInTheDocument()
    // formatCurrency(1234567.89) → "$1,234,567.89" (es-MX, MXN)
    expect(screen.getByText("$1,234,567.89")).toBeInTheDocument()
  })

  it("handles zero values gracefully", () => {
    render(
      <KpiCards
        totalProductos={0}
        alertasStock={0}
        valorInventario={0}
        ultimasRecepciones={0}
      />,
    )

    // Count cards show "0"
    const zeroTexts = screen.getAllByText("0")
    expect(zeroTexts.length).toBeGreaterThanOrEqual(3)

    // Currency card shows "$0.00"
    expect(screen.getByText("$0.00")).toBeInTheDocument()
  })

  it("renders an icon inside each card", () => {
    const { container } = render(<KpiCards {...defaultProps} />)

    // Each of the 4 cards has an SVG icon with size-5 class
    const icons = container.querySelectorAll("svg.size-5")
    expect(icons.length).toBe(4)
  })
})
