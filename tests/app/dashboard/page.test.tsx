import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getDashboardKPIs: vi.fn(),
  listDashboardStock: vi.fn(),
  listReceipts: vi.fn(),
  getCurrentExchangeRateDisplay: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({ getSession: mocks.getSession }))
vi.mock("@/lib/supabase/actions/inventario", () => ({
  getDashboardKPIs: mocks.getDashboardKPIs,
  listDashboardStock: mocks.listDashboardStock,
}))
vi.mock("@/lib/supabase/actions/compras", () => ({
  listReceipts: mocks.listReceipts,
}))
vi.mock("@/lib/supabase/actions/tasas", () => ({
  getCurrentExchangeRateDisplay: mocks.getCurrentExchangeRateDisplay,
}))
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

import DashboardPage from "@/app/(dashboard)/dashboard/page"

const stockRow = {
  id: "product-1",
  nombre: "Tornillo 1/4",
  sku: "TOR-001",
  stock_actual: 3,
  stock_minimo: 5,
  tipo_unidad: "unidad",
  unidad_base: "und",
  unidad_medida: "pza",
  activo: true,
}

const receipt = {
  id: "receipt-1",
  numero_recepcion: "REC-001",
  created_at: "2026-08-27T10:00:00Z",
  proveedores: { nombre: "Proveedor Norte", ruc: null },
  receipt_items: [{ count: 2 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getSession.mockResolvedValue({
    data: { role: "admin" },
  })
  mocks.getDashboardKPIs.mockResolvedValue({
    data: { totalProductos: 10, alertasStock: 1, valorInventario: 250 },
    error: null,
  })
  mocks.listDashboardStock.mockResolvedValue({
    data: { rows: [stockRow], total: 1, page: 1, pageSize: 10 },
    error: null,
  })
  mocks.listReceipts.mockResolvedValue({ data: [receipt], total: 1, error: null })
  mocks.getCurrentExchangeRateDisplay.mockResolvedValue({
    data: { tasa: 36.5, fuente: "api_bcv", createdAt: null, status: "current" },
    error: null,
  })
})

describe("DashboardPage", () => {
  it("renders KPI, stock, recent receipts, and quick navigation sections", async () => {
    render(await DashboardPage())

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
    expect(screen.getByText("REC-001")).toBeInTheDocument()
    expect(screen.getByText("Productos")).toBeInTheDocument()
  })

  it("keeps receipts and stock visible when KPI data fails", async () => {
    mocks.getDashboardKPIs.mockResolvedValue({
      data: null,
      error: "KPI failed",
    })

    render(await DashboardPage())

    expect(screen.getByText("KPI failed")).toBeInTheDocument()
    expect(screen.getByText("REC-001")).toBeInTheDocument()
    expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
  })

  it("redirects non-admin users to inventory", async () => {
    mocks.getSession.mockResolvedValue({ data: { role: "seller" } })
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT")
    })

    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT")
    expect(mocks.redirect).toHaveBeenCalledWith("/inventory")
  })

  it("keeps KPIs and receipts visible when stock data fails", async () => {
    mocks.listDashboardStock.mockResolvedValue({
      data: null,
      error: "Stock failed",
    })

    render(await DashboardPage())

    expect(screen.getByText("Stock failed")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("REC-001")).toBeInTheDocument()
  })

  it("keeps KPIs and stock visible when receipts fail", async () => {
    mocks.listReceipts.mockResolvedValue({
      data: null,
      total: null,
      error: "Receipts failed",
    })

    render(await DashboardPage())

    expect(screen.getByText("Receipts failed")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
  })
})
