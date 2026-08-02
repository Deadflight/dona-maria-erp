import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductSearch } from "@/app/(pos)/pos/_components/product-search"
import type { CartProduct } from "@/app/(pos)/pos/_hooks/use-cart"

// ---------------------------------------------------------------------------
// Polyfills
// ---------------------------------------------------------------------------

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock)

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSearchProducts = vi.fn()
vi.mock("@/lib/supabase/actions/productos", () => ({
  searchProducts: (...args: unknown[]) => mockSearchProducts(...args),
}))

const mockGetRecentSearches = vi.fn()
const mockAddRecentSearch = vi.fn()
const mockRemoveRecentSearch = vi.fn()
vi.mock("@/lib/recent-searches", () => ({
  getRecentSearches: (...args: unknown[]) => mockGetRecentSearches(...args),
  addRecentSearch: (...args: unknown[]) => mockAddRecentSearch(...args),
  removeRecentSearch: (...args: unknown[]) => mockRemoveRecentSearch(...args),
}))

vi.mock("lucide-react", () => ({
  SearchIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-search" {...props} />,
  CheckIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-check" {...props} />,
  PackageX: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-packagex" {...props} />,
  X: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-x" {...props} />,
  EyeOff: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-eyeoff" {...props} />,
  Eye: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-eye" {...props} />,
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const tornillo: CartProduct = {
  id: "prod-1",
  nombre: "Tornillo 1/4",
  sku: "TOR-001",
  precio_venta: 5.0,
  stock_actual: 100,
  tipo_unidad: "unidad",
  unidad_base: "und",
  factor_conversion: 1,
  categoria: "Ferretería",
}

const cable: CartProduct = {
  id: "prod-2",
  nombre: "Cable THW",
  sku: "CAB-001",
  precio_venta: 2.5,
  stock_actual: 50,
  tipo_unidad: "peso",
  unidad_base: "kg",
  factor_conversion: 1,
  categoria: "Electricidad",
}

const outOfStock: CartProduct = {
  id: "prod-3",
  nombre: "Martillo",
  sku: "MAR-001",
  precio_venta: 15.0,
  stock_actual: 0,
  tipo_unidad: "unidad",
  unidad_base: "und",
  factor_conversion: 1,
  categoria: "Ferretería",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderProductSearch(
  props: Partial<Parameters<typeof ProductSearch>[0]> = {},
) {
  const onSelect = vi.fn()
  const view = render(
    <ProductSearch onSelect={onSelect} {...props} />,
  )
  return { onSelect, ...view }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  mockGetRecentSearches.mockReturnValue([])
  mockSearchProducts.mockResolvedValue({ data: null, error: null })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("ProductSearch", () => {
  describe("initial render", () => {
    it("renders search input with placeholder", () => {
      renderProductSearch()
      expect(
        screen.getByPlaceholderText(/Buscar producto/i),
      ).toBeInTheDocument()
    })

    it("shows hint text when empty and not focused", () => {
      renderProductSearch()
      expect(screen.getByText(/Escriba para buscar/i)).toBeInTheDocument()
    })

    it("shows popular products in empty state", async () => {
      vi.useRealTimers()
      renderProductSearch({ popularProducts: [tornillo, cable] })
      await userEvent.click(screen.getByPlaceholderText(/Buscar producto/i))
      expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
      expect(screen.getByText("Cable THW")).toBeInTheDocument()
    })

    it("shows recent searches from storage in empty state", async () => {
      mockGetRecentSearches.mockReturnValue(["Clavo", "Cable"])
      vi.useRealTimers()
      renderProductSearch()
      await userEvent.click(screen.getByPlaceholderText(/Buscar producto/i))
      expect(screen.getByText("Clavo")).toBeInTheDocument()
      expect(screen.getByText("Cable")).toBeInTheDocument()
    })
  })

  describe("keyboard shortcuts", () => {
    it("focuses input on F1 key", () => {
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)
      expect(input).not.toHaveFocus()

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "F1" }))
      expect(input).toHaveFocus()
    })
  })

  describe("search behavior (II-01)", () => {
    it("debounces search call when typing", async () => {
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Tor")

      // Should NOT have called immediately (debounced)
      expect(mockSearchProducts).not.toHaveBeenCalled()

      // Advance past debounce (200ms)
      vi.advanceTimersByTime(250)

      expect(mockSearchProducts).toHaveBeenCalledTimes(1)
      expect(mockSearchProducts).toHaveBeenCalledWith("Tor")
    })

    it("does not search when typing spaces only", async () => {
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "   ")
      vi.advanceTimersByTime(250)

      expect(mockSearchProducts).not.toHaveBeenCalled()
    })

    it("shows loading state while searching", async () => {
      vi.useRealTimers()
      // Return a promise that never resolves during render
      mockSearchProducts.mockReturnValue(new Promise(() => {}))
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Tor")
      await vi.waitFor(() => {
        expect(screen.getByText("Buscando...")).toBeInTheDocument()
      })
    })

    it("displays search results grouped by category", async () => {
      mockSearchProducts.mockResolvedValue({
        data: [tornillo, cable],
        error: null,
      })

      // We need a manual resolve helper since fake timers interfere with promises
      vi.useRealTimers()
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Tor")
      await vi.waitFor(() => {
        expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
        expect(screen.getByText("Cable THW")).toBeInTheDocument()
      })
      // Category headers should be present
      expect(screen.getByText("Ferretería")).toBeInTheDocument()
      expect(screen.getByText("Electricidad")).toBeInTheDocument()
    })

    it("shows stock badge with stock_actual for in-stock products", async () => {
      mockSearchProducts.mockResolvedValue({
        data: [tornillo],
        error: null,
      })

      vi.useRealTimers()
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Tor")
      await vi.waitFor(() => {
        expect(screen.getByText(/Stock: 100/)).toBeInTheDocument()
      })
    })

    it("shows sin-stock badge for out-of-stock products", async () => {
      mockSearchProducts.mockResolvedValue({
        data: [outOfStock],
        error: null,
      })

      vi.useRealTimers()
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Mar")
      await vi.waitFor(() => {
        expect(screen.getByText(/Sin stock/)).toBeInTheDocument()
      })
    })

    it("shows empty message when no results match", async () => {
      mockSearchProducts.mockResolvedValue({
        data: [],
        error: null,
      })

      vi.useRealTimers()
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "zzzzz")
      await vi.waitFor(() => {
        expect(screen.getByText(/Sin resultados/i)).toBeInTheDocument()
      })
    })

    it("calls onSelect when clicking a product", async () => {
      mockSearchProducts.mockResolvedValue({
        data: [tornillo],
        error: null,
      })

      vi.useRealTimers()
      const { onSelect } = renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Tor")
      await vi.waitFor(() => {
        expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText("Tornillo 1/4"))
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: tornillo.id,
          nombre: tornillo.nombre,
          sku: tornillo.sku,
          precio_venta: tornillo.precio_venta,
          stock_actual: tornillo.stock_actual,
        }),
      )
    })
  })

  describe("hide out-of-stock toggle", () => {
    beforeEach(() => {
      // Clear localStorage mock
      vi.stubGlobal("localStorage", {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      })
    })

    it("toggles out-of-stock products visibility", async () => {
      mockSearchProducts.mockResolvedValue({
        data: [tornillo, outOfStock],
        error: null,
      })

      vi.useRealTimers()
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Tor")
      await vi.waitFor(() => {
        expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
      })
    })

    it("shows hide toggle button", () => {
      vi.useRealTimers()
      renderProductSearch()
      expect(screen.getByText("Sin stock")).toBeInTheDocument()
    })
  })

  describe("recent searches", () => {
    it("saves search term to recent searches on select", async () => {
      mockSearchProducts.mockResolvedValue({
        data: [tornillo],
        error: null,
      })

      vi.useRealTimers()
      renderProductSearch()
      const input = screen.getByPlaceholderText(/Buscar producto/i)

      await userEvent.type(input, "Tor")
      await vi.waitFor(() => {
        expect(screen.getByText("Tornillo 1/4")).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText("Tornillo 1/4"))
      expect(mockAddRecentSearch).toHaveBeenCalledWith("Tornillo 1/4")
    })
  })
})
