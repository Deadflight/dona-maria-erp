import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { ReceiptDetailDialog } from "@/app/(dashboard)/receipts/_components/receipt-detail-dialog"

const mockPush = vi.hoisted(() => vi.fn())
const mockReplace = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

const mockGetReceiptById = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/actions/compras", () => ({
  getReceiptById: mockGetReceiptById,
}))


const sampleDetail = {
  id: "rec-1",
  numero_recepcion: "RC-20260610-0001",
  proveedor_id: "prov-1",
  observaciones: null,
  created_by: "user-1",
  created_at: "2026-06-10T12:00:00Z",
  proveedores: { id: "prov-1", nombre: "Proveedor A", ruc: "J-12345678" },
  receipt_items: [
    {
      id: "item-1",
      receipt_id: "rec-1",
      producto_id: "prod-1",
      cantidad_recibida: 10,
      precio_compra: 25,
      created_at: "2026-06-10T12:00:00Z",
      productos: { nombre: "Producto 1", sku: "SKU-001" },
    },
    {
      id: "item-2",
      receipt_id: "rec-1",
      producto_id: "prod-2",
      cantidad_recibida: 5,
      precio_compra: 30,
      created_at: "2026-06-10T12:00:00Z",
      productos: { nombre: "Producto 2", sku: "SKU-002" },
    },
  ],
  created_by_profiles: { full_name: "Admin User" },
}

describe("ReceiptDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders receipt header information after fetch resolves", async () => {
    mockGetReceiptById.mockResolvedValue({ data: sampleDetail, error: null })

    render(
      <ReceiptDetailDialog
        receiptId="rec-1"
        open={true}
        onOpenChange={() => { }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("RC-20260610-0001")).toBeInTheDocument()
    })
    expect(screen.getByText("Proveedor A")).toBeInTheDocument()
    expect(screen.getByText("Admin User")).toBeInTheDocument()
  })

  it("renders items table with products after fetch", async () => {
    mockGetReceiptById.mockResolvedValue({ data: sampleDetail, error: null })

    render(
      <ReceiptDetailDialog
        receiptId="rec-1"
        open={true}
        onOpenChange={() => { }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("Producto 1")).toBeInTheDocument()
    })
    expect(screen.getByText("SKU-001")).toBeInTheDocument()
    expect(screen.getByText("Producto 2")).toBeInTheDocument()
    expect(screen.getByText("SKU-002")).toBeInTheDocument()
  })

  it("shows item quantities and prices after fetch", async () => {
    mockGetReceiptById.mockResolvedValue({ data: sampleDetail, error: null })

    render(
      <ReceiptDetailDialog
        receiptId="rec-1"
        open={true}
        onOpenChange={() => { }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument()
    })
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("does not render content when open is false", () => {
    render(
      <ReceiptDetailDialog
        receiptId={null}
        open={false}
        onOpenChange={() => {}}
      />,
    )

    expect(screen.queryByText("RC-20260610-0001")).not.toBeInTheDocument()
  })

  it("shows error message when fetch fails", async () => {
    mockGetReceiptById.mockResolvedValue({ data: null, error: "Not found" })

    render(
      <ReceiptDetailDialog
        receiptId="rec-999"
        open={true}
        onOpenChange={() => { }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })
})
