import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ProductFormDialog } from "@/app/(dashboard)/products/_components/product-form-dialog"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateProduct = vi.fn()
const mockUpdateProduct = vi.fn()
vi.mock("@/lib/supabase/actions/productos", () => ({
  createProduct: (...args: unknown[]) => mockCreateProduct(...args),
  updateProduct: (...args: unknown[]) => mockUpdateProduct(...args),
}))

// ---------------------------------------------------------------------------
// Sample product (edit mode)
// ---------------------------------------------------------------------------

const sampleProduct = {
  id: "prod-1",
  sku: "CLA-001",
  nombre: "Clavo 2\"",
  descripcion: "Clavo de acero 2 pulgadas",
  categoria: "Ferretería General",
  unidad_medida: "Pieza",
  precio_venta: 5.5,
  precio_compra: 2.75,
  stock_actual: 100,
  stock_minimo: 10,
  codigo_barras: "123456789",
  activo: true,
  created_at: "2026-06-01T12:00:00Z",
  updated_at: null,
  tipo_unidad: "peso",
  unidad_base: "kg",
  factor_conversion: 1,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderCreateForm() {
  return render(
    <ProductFormDialog mode="create" onClose={vi.fn()} />,
  )
}

function renderEditForm() {
  return render(
    <ProductFormDialog mode="edit" product={sampleProduct} onClose={vi.fn()} />,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProductFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------
  // Rendering — basic fields
  // -------------------------------------------------------------------

  it("renders form title and basic fields for create mode", () => {
    renderCreateForm()

    expect(screen.getByText("Nuevo Producto")).toBeInTheDocument()
    expect(screen.getByText("SKU")).toBeInTheDocument()
    expect(screen.getByText("Nombre")).toBeInTheDocument()
    expect(screen.getByText("Descripción")).toBeInTheDocument()
  })

  it("renders Tipo de Unidad hidden input with default 'unidad' on create", () => {
    renderCreateForm()

    const hiddenInput = document.querySelector(
      'input[name="tipo_unidad"]',
    ) as HTMLInputElement
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput.value).toBe("unidad")
  })

  it("renders Unidad Base hidden input with default 'und' on create", () => {
    renderCreateForm()

    const hiddenInput = document.querySelector(
      'input[name="unidad_base"]',
    ) as HTMLInputElement
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput.value).toBe("und")
  })

  // -------------------------------------------------------------------
  // ESC-012: Product form step changes by type
  // -------------------------------------------------------------------

  it("renders stock_actual with step=1 when tipo_unidad='unidad' (default)", () => {
    renderCreateForm()

    const stockActual = screen.getByLabelText("Stock Actual")
    expect(stockActual).toHaveAttribute("step", "1")
    expect(stockActual).toHaveAttribute("min", "1")
  })

  it("renders stock_minimo with step=1 when tipo_unidad='unidad' (default)", () => {
    renderCreateForm()

    const stockMinimo = screen.getByLabelText("Stock Mínimo")
    expect(stockMinimo).toHaveAttribute("step", "1")
    expect(stockMinimo).toHaveAttribute("min", "1")
  })

  // -------------------------------------------------------------------
  // Edit mode — pre-populated values
  // -------------------------------------------------------------------

  it("renders hidden tipo_unidad with product's value on edit", () => {
    renderEditForm()

    const hiddenInput = document.querySelector(
      'input[name="tipo_unidad"]',
    ) as HTMLInputElement
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput.value).toBe("peso")
  })

  it("renders hidden unidad_base with product's value on edit", () => {
    renderEditForm()

    const hiddenInput = document.querySelector(
      'input[name="unidad_base"]',
    ) as HTMLInputElement
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput.value).toBe("kg")
  })

  it("renders stock_actual with step=0.001 for peso product on edit", () => {
    renderEditForm()

    const stockActual = screen.getByLabelText("Stock Actual")
    expect(stockActual).toHaveAttribute("step", "0.001")
    expect(stockActual).toHaveAttribute("min", "0.001")
  })

  // -------------------------------------------------------------------
  // Factor de Conversión visibility
  // -------------------------------------------------------------------

  it("hides factor_conversion when tipo_unidad is 'unidad' on create", () => {
    renderCreateForm()

    expect(
      screen.queryByText("Factor de Conversión"),
    ).not.toBeInTheDocument()
  })

  it("shows factor_conversion when tipo_unidad is 'peso' on edit", () => {
    renderEditForm()

    expect(
      screen.getByText("Factor de Conversión"),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Triggers with correct aria-labels
  // -------------------------------------------------------------------

  it("renders Tipo de Unidad select trigger with aria-label", () => {
    renderCreateForm()

    expect(
      screen.getByRole("combobox", { name: /tipo de unidad/i }),
    ).toBeInTheDocument()
  })

  it("renders Unidad Base select trigger with aria-label", () => {
    renderCreateForm()

    expect(
      screen.getByRole("combobox", { name: /unidad base/i }),
    ).toBeInTheDocument()
  })
})
