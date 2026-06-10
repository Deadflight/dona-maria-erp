import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.hoisted(() => vi.fn())
const mockRefresh = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

import { StockLevelTable } from "@/app/(dashboard)/dashboard/_components/stock-level-table"

describe("StockLevelTable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseProduct = {
    id: "1",
    nombre: "Tornillos 1/2",
    sku: "TOR-001",
    stock_actual: 5,
    stock_minimo: 10,
    activo: true,
    categoria: "Ferretería",
    codigo_barras: null,
    created_at: null,
    descripcion: null,
    precio_compra: 10,
    precio_venta: 20,
    unidad_medida: "pza",
    updated_at: null,
  }

  const criticalProduct = { ...baseProduct }

  const okProduct = {
    ...baseProduct,
    id: "2",
    nombre: "Taladro Industrial",
    sku: "TAL-001",
    stock_actual: 50,
    stock_minimo: 10,
  }

  it("renders table with product rows", () => {
    render(
      <StockLevelTable
        initialData={[criticalProduct, okProduct]}
        error={null}
      />,
    )

    expect(screen.getByText("Tornillos 1/2")).toBeInTheDocument()
    expect(screen.getByText("Taladro Industrial")).toBeInTheDocument()
    expect(screen.getByText("TOR-001")).toBeInTheDocument()
    expect(screen.getByText("TAL-001")).toBeInTheDocument()
    expect(screen.getByText("5.00")).toBeInTheDocument()
    expect(screen.getByText("50.00")).toBeInTheDocument()
    // 10.00 appears twice (both products have stock_minimo=10)
    const minStockValues = screen.getAllByText("10.00")
    expect(minStockValues.length).toBe(2)
  })

  it("shows CRÍTICO badge when stock_actual <= stock_minimo", () => {
    render(
      <StockLevelTable
        initialData={[criticalProduct]}
        error={null}
      />,
    )

    // criticalProduct: stock_actual=5 <= stock_minimo=10 → CRÍTICO
    const badges = screen.getAllByText("CRÍTICO")
    expect(badges.length).toBe(1)
  })

  it("does NOT show CRÍTICO badge when stock_actual > stock_minimo", () => {
    render(
      <StockLevelTable
        initialData={[okProduct]}
        error={null}
      />,
    )

    expect(screen.queryByText("CRÍTICO")).not.toBeInTheDocument()
  })

  it("shows empty state when no alerts", () => {
    render(<StockLevelTable initialData={[]} error={null} />)

    expect(
      screen.getByText("No hay productos con stock crítico"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Todos los productos tienen stock suficiente."),
    ).toBeInTheDocument()
  })

  it("shows error state with retry button", () => {
    render(
      <StockLevelTable
        initialData={[]}
        error="Error de conexión con la base de datos"
      />,
    )

    // Error alert renders
    expect(
      screen.getByText("Error al cargar alertas"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Error de conexión con la base de datos"),
    ).toBeInTheDocument()
    expect(screen.getByText("Reintentar")).toBeInTheDocument()

    // Clicking Reintentar calls router.refresh()
    fireEvent.click(screen.getByText("Reintentar"))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('"Ver todos" button navigates to /inventory', () => {
    render(
      <StockLevelTable
        initialData={[criticalProduct]}
        error={null}
      />,
    )

    fireEvent.click(screen.getByText("Ver todos"))
    expect(mockPush).toHaveBeenCalledWith("/inventory")
  })

  it("renders table column headers", () => {
    render(
      <StockLevelTable
        initialData={[criticalProduct]}
        error={null}
      />,
    )

    expect(screen.getByText("Producto")).toBeInTheDocument()
    expect(screen.getByText("SKU")).toBeInTheDocument()
    expect(screen.getByText("Stock Actual")).toBeInTheDocument()
    expect(screen.getByText("Stock Mínimo")).toBeInTheDocument()
    expect(screen.getByText("Estado")).toBeInTheDocument()
  })
})
