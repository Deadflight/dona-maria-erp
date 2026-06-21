import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ReceiptDetailDialog } from "@/app/(dashboard)/receipts/_components/receipt-detail-dialog"

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const receiptDetail = {
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
      recepcion_id: "rec-1",
      producto_id: "prod-1",
      cantidad_recibida: 10,
      precio_compra: 25.5,
      created_at: "2026-06-10T12:00:00Z",
      productos: { nombre: "Tornillo 1/2", sku: "TOR-001" },
    },
    {
      id: "item-2",
      recepcion_id: "rec-1",
      producto_id: "prod-2",
      cantidad_recibida: 5,
      precio_compra: 30,
      created_at: "2026-06-10T12:00:00Z",
      productos: { nombre: "Tuerca 1/2", sku: "TUE-001" },
    },
  ],
  created_by_profiles: { full_name: "Admin User" },
}

const receiptDetailEmptyItems = {
  id: "rec-2",
  numero_recepcion: "RC-20260610-0002",
  proveedor_id: "prov-2",
  observaciones: null,
  created_by: "user-1",
  created_at: "2026-06-10T14:00:00Z",
  proveedores: { id: "prov-2", nombre: "Proveedor B", ruc: "J-87654321" },
  receipt_items: [],
  created_by_profiles: { full_name: "Admin User" },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReceiptDetailDialog", () => {
  it("shows header with supplier, number, date and creator", () => {
    render(
      <ReceiptDetailDialog
        receipt={receiptDetail}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Proveedor A")).toBeInTheDocument()
    expect(screen.getByText("RC-20260610-0001")).toBeInTheDocument()
    expect(screen.getByText("Admin User")).toBeInTheDocument()
    // Date should be formatted (e.g., "10 jun 2026")
    expect(screen.getByText(/jun 2026/)).toBeInTheDocument()
  })

  it("shows items table with subtotals and total", () => {
    render(
      <ReceiptDetailDialog
        receipt={receiptDetail}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )

    // Item names
    expect(screen.getByText("Tornillo 1/2")).toBeInTheDocument()
    expect(screen.getByText("Tuerca 1/2")).toBeInTheDocument()

    // SKUs
    expect(screen.getByText("TOR-001")).toBeInTheDocument()
    expect(screen.getByText("TUE-001")).toBeInTheDocument()

    // Item 1 subtotal: 10 × $25.50 = $255.00
    expect(screen.getByText("$255.00")).toBeInTheDocument()
    // Item 2 subtotal: 5 × $30.00 = $150.00
    expect(screen.getByText("$150.00")).toBeInTheDocument()
  })

  it("shows total of all items", () => {
    render(
      <ReceiptDetailDialog
        receipt={receiptDetail}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )

    // Total: $255.00 + $150.00 = $405.00
    expect(screen.getByText("$405.00")).toBeInTheDocument()
  })

  it("shows empty items message when no items", () => {
    render(
      <ReceiptDetailDialog
        receipt={receiptDetailEmptyItems}
        open={true}
        onOpenChange={vi.fn()}
      />,
    )

    expect(
      screen.getByText("No hay artículos en esta recepción"),
    ).toBeInTheDocument()
  })
})
