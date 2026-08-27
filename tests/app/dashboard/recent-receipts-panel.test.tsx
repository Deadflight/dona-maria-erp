import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RecentReceiptsPanel } from "@/app/(dashboard)/dashboard/_components/recent-receipts-panel"

const receipts = [
  {
    id: "receipt-1",
    numero_recepcion: "REC-002",
    created_at: "2026-08-27T10:00:00Z",
    proveedores: { nombre: "Proveedor Norte" },
    receipt_items: [{ count: 3 }],
  },
  {
    id: "receipt-2",
    numero_recepcion: "REC-001",
    created_at: "2026-08-26T10:00:00Z",
    proveedores: null,
    receipt_items: [],
  },
]

describe("RecentReceiptsPanel", () => {
  it("renders receipt fields and detail links", () => {
    render(<RecentReceiptsPanel receipts={receipts} error={null} />)

    expect(screen.getByText("REC-002")).toBeInTheDocument()
    expect(screen.getByText("Proveedor Norte")).toBeInTheDocument()
    expect(screen.getByText("3 líneas")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /REC-002/ })).toHaveAttribute(
      "href",
      "/receipts",
    )
  })

  it("renders safe fallbacks for incomplete receipt relationships", () => {
    render(<RecentReceiptsPanel receipts={receipts} error={null} />)

    expect(screen.getByText("Sin proveedor")).toBeInTheDocument()
    expect(screen.getByText("0 líneas")).toBeInTheDocument()
  })

  it("renders when receipt line data is missing", () => {
    render(
      <RecentReceiptsPanel
        receipts={[{ ...receipts[0], receipt_items: null }]}
        error={null}
      />,
    )

    expect(screen.getByText("0 líneas")).toBeInTheDocument()
  })

  it("renders explicit empty and error states", () => {
    const { rerender } = render(
      <RecentReceiptsPanel receipts={[]} error={null} />,
    )
    expect(screen.getByText("No hay recepciones recientes")).toBeInTheDocument()

    rerender(<RecentReceiptsPanel receipts={null} error="Receipts failed" />)
    expect(screen.getByText("Receipts failed")).toBeInTheDocument()
  })
})