import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import {
  getDailySummary,
  closeDay,
  getCloseHistory,
} from "@/lib/supabase/actions/cierres"
import {
  calculateDiscrepancy,
  isWithinTolerance,
} from "@/lib/financial/tolerance"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock Supabase chain builders
// ---------------------------------------------------------------------------

let ventasResolveValue: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

const mockVentasSingle = vi.fn()

const mockVentasChain: Record<string, unknown> = {
  select: vi.fn(() => mockVentasChain),
  eq: vi.fn(() => mockVentasChain),
  gte: vi.fn(() => mockVentasChain),
  lt: vi.fn(() => mockVentasChain),
  order: vi.fn(() => mockVentasChain),
  limit: vi.fn(() => mockVentasChain),
  single: mockVentasSingle,
  insert: vi.fn(() => mockVentasChain),
  then: (resolve: (v: unknown) => void) => resolve(ventasResolveValue),
}

let cierresResolveValue: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

const mockCierresChain: Record<string, unknown> = {
  select: vi.fn(() => mockCierresChain),
  order: vi.fn(() => mockCierresChain),
  limit: vi.fn(() => mockCierresChain),
  then: (resolve: (v: unknown) => void) => resolve(cierresResolveValue),
}

const mockFrom = vi.fn((table: string) => {
  if (table === "ventas") return mockVentasChain
  if (table === "cierres_diarios") return mockCierresChain
  return mockVentasChain
})

const mockSupabase = { from: mockFrom }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tolerance Helpers", () => {
  it("calculateDiscrepancy returns fisico - sistema", () => {
    expect(calculateDiscrepancy(1000, 1000)).toBe(0)
    expect(calculateDiscrepancy(1000, 950)).toBe(-50)
    expect(calculateDiscrepancy(1000, 1050)).toBe(50)
  })

  it("isWithinTolerance uses 5% or $100, whichever is greater", () => {
    // For small amounts: threshold = $100
    expect(isWithinTolerance(50, 200)).toBe(true)
    expect(isWithinTolerance(150, 200)).toBe(false)

    // For large amounts: threshold = 5%
    expect(isWithinTolerance(49, 1000)).toBe(true) // 49 < 50 (5%)
    expect(isWithinTolerance(51, 1000)).toBe(true) // 51 < 100 (min threshold)
    expect(isWithinTolerance(150, 3000)).toBe(true) // 150 = 5% of 3000
    expect(isWithinTolerance(200, 3000)).toBe(false) // 200 > 150 (5% of 3000)
  })
})

describe("getDailySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ventasResolveValue = { data: [], error: null }
    cierresResolveValue = { data: [], error: null }
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "u1", role: "admin" },
    })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase,
    )
  })

  it("returns empty summary when no sales exist", async () => {
    const result = await getDailySummary("2026-01-15")
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.systemTotal).toBe(0)
    expect(result.data!.totalTransactions).toBe(0)
    expect(result.data!.averageTicket).toBe(0)
    expect(result.data!.methods).toEqual([])
    expect(result.data!.cancelled.count).toBe(0)
  })

  it("returns error when user is not authenticated", async () => {
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
    })
    const result = await getDailySummary("2026-01-15")
    expect(result.error).toBe("UNAUTHORIZED")
  })

  it("returns error when user is seller", async () => {
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "u1", role: "seller" },
    })
    const result = await getDailySummary("2026-01-15")
    expect(result.error).toBeNull() // sellers can view
  })
})

describe("closeDay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ventasResolveValue = { data: [], error: null }
    cierresResolveValue = { data: [], error: null }
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "u1", role: "admin" },
    })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase,
    )
  })

  it("returns error when user is not admin", async () => {
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "u1", role: "viewer" },
    })
    const result = await closeDay({
      fecha: "2026-01-15",
      monto_fisico: 1000,
    })
    expect(result.error).toBe("FORBIDDEN")
  })

  it("returns error when user is not authenticated", async () => {
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
    })
    const result = await closeDay({
      fecha: "2026-01-15",
      monto_fisico: 1000,
    })
    expect(result.error).toBe("UNAUTHORIZED")
  })
})

describe("getCloseHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cierresResolveValue = { data: [], error: null }
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "u1", role: "admin" },
    })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase,
    )
  })

  it("returns empty array when no closings exist", async () => {
    const result = await getCloseHistory()
    expect(result.error).toBeNull()
    expect(result.data).toEqual([])
  })

  it("returns error when user is not admin", async () => {
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "u1", role: "viewer" },
    })
    const result = await getCloseHistory()
    expect(result.error).toBe("FORBIDDEN")
  })

  it("returns error when user is not authenticated", async () => {
    ;(getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
    })
    const result = await getCloseHistory()
    expect(result.error).toBe("UNAUTHORIZED")
  })
})
