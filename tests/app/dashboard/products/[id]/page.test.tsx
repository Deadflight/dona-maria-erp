import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Hoisted mocks (must be at top level for vi.mock hoisting)
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn()
const mockGetProductById = vi.fn()
const mockRedirect = vi.fn()
const mockNotFound = vi.fn()

vi.mock("@/actions/auth", () => ({
  getSession: () => mockGetSession(),
}))

vi.mock("@/lib/supabase/actions/productos", () => ({
  getProductById: (id: string) => mockGetProductById(id),
}))

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    // Next.js redirect() throws — tests after redirect must not execute
    throw new Error("NEXT_REDIRECT")
  },
  notFound: () => {
    mockNotFound()
    // Next.js notFound() throws — tests after notFound must not execute
    throw new Error("NEXT_NOT_FOUND")
  },
}))

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { default as EditProductPage } from "@/app/(dashboard)/products/[id]/page"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const adminSession = {
  data: {
    id: "admin-1",
    email: "admin@test.com",
    role: "admin",
    fullName: "Admin User",
    isActive: true,
  },
}

const sellerSession = {
  data: {
    id: "seller-1",
    email: "seller@test.com",
    role: "seller",
    fullName: "Seller User",
    isActive: true,
  },
}

const viewerSession = {
  data: {
    id: "viewer-1",
    email: "viewer@test.com",
    role: "viewer",
    fullName: "Viewer User",
    isActive: true,
  },
}

const mockProduct = {
  id: "prod-1",
  nombre: "Cemento Portland",
  sku: "PROD-20260725-001",
  categoria: "Materiales",
  descripcion: "Cemento de 50kg",
  precio_venta: 150,
  precio_compra: 120,
  stock_actual: 100,
  stock_minimo: 20,
  unidad_medida: "Bolsa",
  tipo_unidad: "unidad",
  unidad_base: "und",
  factor_conversion: 1,
  codigo_barras: null,
  activo: true,
  created_at: "2026-07-25T10:00:00Z",
  updated_at: null,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EditProductPage (RSC data-flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------
  // ESC-E: Viewer role → redirect to /products
  // -------------------------------------------------------------------

  it("redirects viewer role to /products", async () => {
    mockGetSession.mockResolvedValue(viewerSession)

    try {
      await EditProductPage({ params: Promise.resolve({ id: "prod-1" }) })
    } catch {
      // redirect() throws in Next.js; ignore expected throw
    }

    expect(mockRedirect).toHaveBeenCalledWith("/products")
    expect(mockGetProductById).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------
  // Unauthenticated → redirect to /products
  // -------------------------------------------------------------------

  it("redirects unauthenticated user to /products", async () => {
    mockGetSession.mockResolvedValue({ data: null })

    try {
      await EditProductPage({ params: Promise.resolve({ id: "prod-1" }) })
    } catch {
      // expected
    }

    expect(mockRedirect).toHaveBeenCalledWith("/products")
    expect(mockGetProductById).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------
  // Admin + valid product → renders ProductFormDialog
  // -------------------------------------------------------------------

  it("renders ProductFormDialog for admin with valid product", async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockGetProductById.mockResolvedValue({ data: mockProduct, error: null })

    let result: React.ReactNode | undefined
    try {
      result = await EditProductPage({ params: Promise.resolve({ id: "prod-1" }) })
    } catch {
      // noop
    }

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGetProductById).toHaveBeenCalledWith("prod-1")
    expect(result).toBeDefined()
  })

  // -------------------------------------------------------------------
  // Seller + valid product → renders ProductFormDialog (seller can edit)
  // -------------------------------------------------------------------

  it("renders ProductFormDialog for seller with valid product", async () => {
    mockGetSession.mockResolvedValue(sellerSession)
    mockGetProductById.mockResolvedValue({ data: mockProduct, error: null })

    let result: React.ReactNode | undefined
    try {
      result = await EditProductPage({ params: Promise.resolve({ id: "prod-1" }) })
    } catch {
      // noop
    }

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGetProductById).toHaveBeenCalledWith("prod-1")
    expect(result).toBeDefined()
  })

  // -------------------------------------------------------------------
  // Product not found → notFound()
  // -------------------------------------------------------------------

  it("calls notFound when product does not exist", async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockGetProductById.mockResolvedValue({ data: null, error: "Not found" })

    try {
      await EditProductPage({ params: Promise.resolve({ id: "nonexistent" }) })
    } catch {
      // expected
    }

    expect(mockNotFound).toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------
  // Product fetch error → notFound()
  // -------------------------------------------------------------------

  it("calls notFound when product fetch returns error", async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockGetProductById.mockResolvedValue({ data: null, error: "DB error" })

    try {
      await EditProductPage({ params: Promise.resolve({ id: "prod-err" }) })
    } catch {
      // expected
    }

    expect(mockNotFound).toHaveBeenCalled()
  })
})
