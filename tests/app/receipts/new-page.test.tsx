import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Hoisted mocks (must be at top level for vi.mock hoisting)
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn()
const mockListProveedores = vi.fn()
const mockGenerateReceiptNumber = vi.fn()
const mockRedirect = vi.fn()

vi.mock("@/actions/auth", () => ({
  getSession: () => mockGetSession(),
}))

vi.mock("@/lib/supabase/actions/compras", () => ({
  listProveedores: () => mockListProveedores(),
  generateReceiptNumber: () => mockGenerateReceiptNumber(),
}))

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    // Next.js redirect() throws — tests after redirect must not execute
    throw new Error("NEXT_REDIRECT")
  },
}))

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { default as NewReceiptPage } from "@/app/(dashboard)/receipts/new/page"

describe("NewReceiptPage (RSC data-flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------
  // ESC-4: Non-admin redirect
  // -------------------------------------------------------------------

  it("redirects non-admin to /receipts?readonly=true [ESC-4]", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: "viewer-1",
        email: "viewer@test.com",
        role: "viewer",
        fullName: "Viewer User",
        isActive: true,
      },
    })

    try {
      await NewReceiptPage({ searchParams: Promise.resolve({}) })
    } catch {
      // redirect() throws in Next.js; ignore expected throw
    }

    expect(mockRedirect).toHaveBeenCalledWith("/receipts?readonly=true")
    // Provider actions should NOT be called for non-admin
    expect(mockListProveedores).not.toHaveBeenCalled()
    expect(mockGenerateReceiptNumber).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------
  // Unauthenticated redirect
  // -------------------------------------------------------------------

  it("redirects unauthenticated user to /receipts?readonly=true", async () => {
    mockGetSession.mockResolvedValue({ data: null })

    try {
      await NewReceiptPage({ searchParams: Promise.resolve({}) })
    } catch {
      // expected
    }

    expect(mockRedirect).toHaveBeenCalledWith("/receipts?readonly=true")
  })

  // -------------------------------------------------------------------
  // Admin access — verifies data is fetched
  // -------------------------------------------------------------------

  it("fetches suppliers and receipt number when admin", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: "admin-1",
        email: "admin@test.com",
        role: "admin",
        fullName: "Admin User",
        isActive: true,
      },
    })
    mockListProveedores.mockResolvedValue({
      data: [{ id: "prov-1", nombre: "Proveedor A", ruc: "J-123" }],
      error: null,
    })
    mockGenerateReceiptNumber.mockResolvedValue({
      data: "RC-20260618-0001",
      error: null,
    })

    // Should NOT throw redirect
    let result: React.ReactNode | undefined
    try {
      result = await NewReceiptPage({ searchParams: Promise.resolve({}) })
    } catch {
      // noop
    }

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockListProveedores).toHaveBeenCalled()
    expect(mockGenerateReceiptNumber).toHaveBeenCalled()
    expect(result).toBeDefined()
  })
})
