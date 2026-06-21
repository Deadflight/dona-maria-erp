import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ReceiptForm } from "@/app/(dashboard)/receipts/_components/receipt-form"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRouterPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

const mockCreateReceiptAction = vi.fn()
vi.mock("@/lib/supabase/actions/compras", () => ({
  createReceiptAction: (...args: unknown[]) => mockCreateReceiptAction(...args),
}))

const mockSearchProductsAction = vi.fn()
vi.mock("@/lib/supabase/actions/productos", () => ({
  searchProducts: (...args: unknown[]) => mockSearchProductsAction(...args),
}))

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const suppliers = [
  { id: "prov-1", nombre: "Proveedor A", ruc: "J-12345678" },
  { id: "prov-2", nombre: "Proveedor B", ruc: "J-87654321" },
]
const receiptNumber = "RC-20260618-0001"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderForm() {
  return render(
    <ReceiptForm suppliers={suppliers} receiptNumber={receiptNumber} />,
  )
}

/** Returns the currently rendered item rows (excluding the header row). */
function getItemRows(): Element[] {
  const table = screen.getByRole("table")
  const rows = table.querySelectorAll("tbody tr")
  return Array.from(rows)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReceiptForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateReceiptAction.mockResolvedValue({
      success: true,
      data: { id: "new-rec-1" },
    })
    mockSearchProductsAction.mockResolvedValue({
      data: [
        { id: "prod-1", nombre: "Tornillo 1/2", sku: "TOR-001" },
        { id: "prod-2", nombre: "Tuerca 1/2", sku: "TUE-001" },
      ],
      error: null,
    })
  })

  // -------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------

  it("renders form title, supplier select, and auto-generated receipt number", () => {
    renderForm()

    expect(
      screen.getByText("Nueva Recepción de Mercancía"),
    ).toBeInTheDocument()
    expect(screen.getByText("Proveedor")).toBeInTheDocument()
    expect(screen.getByDisplayValue(receiptNumber)).toBeInTheDocument()
  })

  it("renders the items table with add button and total", () => {
    renderForm()

    expect(screen.getByText("Artículos")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /agregar producto/i }),
    ).toBeInTheDocument()
    expect(screen.getByText("Total:")).toBeInTheDocument()
    // Total amount should be present — we use a matcher that handles
    // the non-breaking space between "Gs" and the amount
    expect(
      screen.getByText((content) => content.startsWith("Gs") && content.includes("0")),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Dynamic items — add / remove
  // -------------------------------------------------------------------

  it("adds an item row when clicking 'Agregar Producto'", () => {
    renderForm()

    const addButton = screen.getByRole("button", { name: /agregar producto/i })
    fireEvent.click(addButton)

    expect(getItemRows()).toHaveLength(1)
  })

  it("adds multiple rows and removes a specific row", () => {
    renderForm()

    const addButton = screen.getByRole("button", { name: /agregar producto/i })

    // Add 3 rows
    fireEvent.click(addButton)
    fireEvent.click(addButton)
    fireEvent.click(addButton)
    expect(getItemRows()).toHaveLength(3)

    // Remove the second row
    const removeButtons = screen.getAllByRole("button", { name: /eliminar/i })
    fireEvent.click(removeButtons[1])

    expect(getItemRows()).toHaveLength(2)
  })

  // -------------------------------------------------------------------
  // Running total
  // -------------------------------------------------------------------

  it("shows running total updated as item quantities and prices change", () => {
    renderForm()

    // Add 2 items
    const addButton = screen.getByRole("button", { name: /agregar producto/i })
    fireEvent.click(addButton)
    fireEvent.click(addButton)

    const rows = getItemRows()

    // Set cantidad 5, precio 10000 on first row
    const cantidadInputs = rows[0].querySelectorAll("input[type='number']")
    fireEvent.change(cantidadInputs[0], { target: { value: "5" } })
    fireEvent.change(cantidadInputs[1], { target: { value: "10000" } })

    // Set cantidad 2, precio 15000 on second row
    const cantidadInputs2 = rows[1].querySelectorAll("input[type='number']")
    fireEvent.change(cantidadInputs2[0], { target: { value: "2" } })
    fireEvent.change(cantidadInputs2[1], { target: { value: "15000" } })

    // Expected total = 5 * 10000 + 2 * 15000 = 80000
    // Formatted with es-PY locale: "80.000" (period as thousands separator)
    expect(
      screen.getByText((content) => content.includes("80.000")),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // ESC-2: Form validation — empty items
  // -------------------------------------------------------------------

  it("shows validation error when submitting with no items [ESC-2]", async () => {
    mockCreateReceiptAction.mockResolvedValue({
      errors: { items: ["Debe agregar al menos un producto"] },
    })

    renderForm()

    const submitButton = screen.getByRole("button", {
      name: /crear recepción/i,
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(
        screen.getByText("Debe agregar al menos un producto"),
      ).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------
  // ESC-3: Form validation — invalid price (0)
  // -------------------------------------------------------------------

  it("shows per-field error for invalid price [ESC-3]", async () => {
    mockCreateReceiptAction.mockResolvedValue({
      errors: {
        "items.0.precio_compra": ["El precio de compra debe ser mayor a 0"],
      },
    })

    renderForm()

    // Add an item (with default price 0)
    fireEvent.click(screen.getByRole("button", { name: /agregar producto/i }))

    const submitButton = screen.getByRole("button", {
      name: /crear recepción/i,
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(
        screen.getByText("El precio de compra debe ser mayor a 0"),
      ).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------
  // ESC-1: Admin creates receipt — success + redirect
  // -------------------------------------------------------------------

  it("submits with valid data and redirects to /receipts [ESC-1]", async () => {
    renderForm()

    // Select a supplier
    const proveedorSelect = screen.getByRole("combobox", { name: /proveedor/i })
    fireEvent.click(proveedorSelect)
    const option = screen.getByRole("option", { name: /proveedor a/i })
    fireEvent.click(option)

    // Add 2 items
    fireEvent.click(screen.getByRole("button", { name: /agregar producto/i }))
    fireEvent.click(screen.getByRole("button", { name: /agregar producto/i }))
    const rows = getItemRows()

    // Set values
    const row1Inputs = rows[0].querySelectorAll("input[type='number']")
    fireEvent.change(row1Inputs[0], { target: { value: "10" } })
    fireEvent.change(row1Inputs[1], { target: { value: "5000" } })

    const row2Inputs = rows[1].querySelectorAll("input[type='number']")
    fireEvent.change(row2Inputs[0], { target: { value: "3" } })
    fireEvent.change(row2Inputs[1], { target: { value: "12000" } })

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /crear recepción/i,
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    // Should redirect on success
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/receipts")
    })
  })

  // -------------------------------------------------------------------
  // ESC-5: Duplicate receipt number — server error banner
  // -------------------------------------------------------------------

  it("shows error banner when server returns duplicate receipt number error [ESC-5]", async () => {
    mockCreateReceiptAction.mockResolvedValue({
      message: "Número de recepción ya existe",
    })

    renderForm()

    // Add an item so we get past items validation
    fireEvent.click(screen.getByRole("button", { name: /agregar producto/i }))

    const submitButton = screen.getByRole("button", {
      name: /crear recepción/i,
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(
        screen.getByText("Número de recepción ya existe"),
      ).toBeInTheDocument()
    })

    // Error should be in an alert role
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Observaciones field
  // -------------------------------------------------------------------

  it("renders optional observaciones textarea", () => {
    renderForm()

    expect(
      screen.getByPlaceholderText("Opcional — notas sobre la recepción"),
    ).toBeInTheDocument()
  })
})
