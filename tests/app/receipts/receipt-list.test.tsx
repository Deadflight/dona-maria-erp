import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ReceiptList } from "@/app/(dashboard)/receipts/_components/receipt-list"

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockRouterPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const adminSession = {
  id: "user-1",
  email: "admin@test.com",
  role: "admin",
  fullName: "Admin User",
  isActive: true,
}

const viewerSession = {
  id: "user-2",
  email: "viewer@test.com",
  role: "viewer",
  fullName: "Viewer User",
  isActive: true,
}

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
    receipt_items: [{ count: 3 }],
  },
  {
    id: "rec-2",
    numero_recepcion: "RC-20260610-0002",
    proveedor_id: "prov-2",
    observaciones: null,
    created_by: "user-1",
    created_at: "2026-06-10T14:00:00Z",
    proveedores: { nombre: "Proveedor B", ruc: "J-87654321" },
    created_by_profiles: { full_name: "Admin User" },
    receipt_items: [{ count: 5 }],
  },
]

const initialData = {
  rows: sampleReceipts,
  total: 2,
  page: 1,
  pageSize: 10,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReceiptList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------

  it("reflects URL search param in search input", () => {
    render(
      <ReceiptList
        initialData={{ rows: [], total: 0, page: 1, pageSize: 10 }}
        error={null}
        searchParams={{ search: "Proveedor A" }}
        session={adminSession}
      />,
    )

    const input = screen.getByPlaceholderText(
      "Buscar por Nº recepción o proveedor...",
    ) as HTMLInputElement
    expect(input.value).toBe("Proveedor A")
  })

  it("shows filter hint in empty state when search is active", () => {
    render(
      <ReceiptList
        initialData={{ rows: [], total: 0, page: 1, pageSize: 10 }}
        error={null}
        searchParams={{ search: "XYZ" }}
        session={adminSession}
      />,
    )

    expect(
      screen.getByText("Intenta ajustar los filtros de búsqueda."),
    ).toBeInTheDocument()
    expect(screen.getByText("Limpiar filtros")).toBeInTheDocument()
  })

  it("calls router.push with search param after debounced input", () => {
    vi.useFakeTimers()

    render(
      <ReceiptList
        initialData={{ rows: [], total: 0, page: 1, pageSize: 10 }}
        error={null}
        searchParams={{}}
        session={adminSession}
      />,
    )

    const input = screen.getByPlaceholderText(
      "Buscar por Nº recepción o proveedor...",
    )

    fireEvent.change(input, { target: { value: "Proveedor A" } })
    // Fast-forward past the 300ms debounce
    vi.advanceTimersByTime(350)

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/receipts?search=Proveedor+A",
    )
  })

  it("renders table with receipt data for admin user", () => {
    render(
      <ReceiptList
        initialData={initialData}
        error={null}
        searchParams={{}}
        session={adminSession}
      />,
    )

    // Table headers
    expect(screen.getByText("Nº Recepción")).toBeInTheDocument()
    expect(screen.getByText("Proveedor")).toBeInTheDocument()
    expect(screen.getByText("Fecha")).toBeInTheDocument()
    expect(screen.getByText("Creado por")).toBeInTheDocument()

    // Data rows
    expect(screen.getByText("RC-20260610-0001")).toBeInTheDocument()
    expect(screen.getByText("Proveedor A")).toBeInTheDocument()
    expect(screen.getByText("RC-20260610-0002")).toBeInTheDocument()
    expect(screen.getByText("Proveedor B")).toBeInTheDocument()

    // Create button visible for admin
    expect(screen.getByText("Nueva Recepción")).toBeInTheDocument()
  })

  it("shows disabled create button for viewer with tooltip text", () => {
    render(
      <ReceiptList
        initialData={initialData}
        error={null}
        searchParams={{}}
        session={viewerSession}
      />,
    )

    const createBtn = screen.getByText("Nueva Recepción")
    expect(createBtn).toBeInTheDocument()
    expect(createBtn.closest("button")).toBeDisabled()

    // Viewer notice should be visible
    expect(screen.getByText("Solo lectura")).toBeInTheDocument()
  })

  it("shows empty state when no receipts exist", () => {
    render(
      <ReceiptList
        initialData={{ rows: [], total: 0, page: 1, pageSize: 10 }}
        error={null}
        searchParams={{}}
        session={adminSession}
      />,
    )

    expect(
      screen.getByText("No hay recepciones registradas"),
    ).toBeInTheDocument()
  })

  it("shows error state with retry button", () => {
    render(
      <ReceiptList
        initialData={null}
        error="Database connection failed"
        searchParams={{}}
        session={adminSession}
      />,
    )

    expect(screen.getByText("Error al cargar recepciones")).toBeInTheDocument()
    expect(screen.getByText("Database connection failed")).toBeInTheDocument()
    expect(screen.getByText("Reintentar")).toBeInTheDocument()
  })
})
