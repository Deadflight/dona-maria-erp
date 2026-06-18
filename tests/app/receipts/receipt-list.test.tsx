import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const mockPush = vi.hoisted(() => vi.fn())
const mockReplace = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

import { ReceiptList } from "@/app/(dashboard)/receipts/_components/receipt-list"
import type { Database } from "@/types/database"

type PurchaseReceipt = Database["public"]["Tables"]["purchase_receipts"]["Row"]

const sampleReceipts = [
  {
    id: "rec-1",
    numero_recepcion: "RC-20260610-0001",
    proveedor_id: "prov-1",
    observaciones: null,
    created_by: "user-1",
    created_at: "2026-06-10T12:00:00Z",
    proveedores: { nombre: "Proveedor A", ruc: "J-12345678" },
    created_by_profiles: { full_name: "Admin User" },
  } as PurchaseReceipt & {
    proveedores: { nombre: string; ruc: string | null }
    created_by_profiles: { full_name: string | null }
  },
  {
    id: "rec-2",
    numero_recepcion: "RC-20260611-0002",
    proveedor_id: "prov-2",
    observaciones: "Compra urgente",
    created_by: "user-1",
    created_at: "2026-06-11T14:30:00Z",
    proveedores: { nombre: "Proveedor B", ruc: "J-87654321" },
    created_by_profiles: { full_name: "Admin User" },
  } as PurchaseReceipt & {
    proveedores: { nombre: string; ruc: string | null }
    created_by_profiles: { full_name: string | null }
  },
]

describe("ReceiptList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders receipts in a table", () => {
    render(
      <ReceiptList
        initialData={sampleReceipts}
        error={null}
        isAdmin={true}
        searchParams={{}}
      />,
    )

    expect(screen.getByText("RC-20260610-0001")).toBeInTheDocument()
    expect(screen.getByText("Proveedor A")).toBeInTheDocument()
    expect(screen.getByText("RC-20260611-0002")).toBeInTheDocument()
    expect(screen.getByText("Proveedor B")).toBeInTheDocument()
  })

  it("shows empty state when no receipts", () => {
    render(
      <ReceiptList
        initialData={[]}
        error={null}
        isAdmin={true}
        searchParams={{}}
      />,
    )

    expect(screen.getByText("No se encontraron recepciones")).toBeInTheDocument()
  })

  it("shows error state when error is present", () => {
    render(
      <ReceiptList
        initialData={null}
        error="Error al cargar"
        isAdmin={true}
        searchParams={{}}
      />,
    )

    expect(
      screen.getByText("Error al cargar recepciones"),
    ).toBeInTheDocument()
  })

  it("shows Nueva Recepción button for admin users", () => {
    render(
      <ReceiptList
        initialData={sampleReceipts}
        error={null}
        isAdmin={true}
        searchParams={{}}
      />,
    )

    expect(
      screen.getByRole("button", { name: /nueva recepción/i }),
    ).toBeInTheDocument()
  })

  it("hides Nueva Recepción button for non-admin users", () => {
    render(
      <ReceiptList
        initialData={sampleReceipts}
        error={null}
        isAdmin={false}
        searchParams={{}}
      />,
    )

    expect(
      screen.queryByRole("button", { name: /nueva recepción/i }),
    ).not.toBeInTheDocument()
  })

  it("renders table with correct columns", () => {
    render(
      <ReceiptList
        initialData={sampleReceipts}
        error={null}
        isAdmin={true}
        searchParams={{}}
      />,
    )

    expect(screen.getByText("Nº Recepción")).toBeInTheDocument()
    expect(screen.getByText("Proveedor")).toBeInTheDocument()
    expect(screen.getByText("Fecha")).toBeInTheDocument()
  })
})
