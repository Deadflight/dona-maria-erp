import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetUser = vi.hoisted(() => vi.fn())
const mockProfileSingle = vi.hoisted(() => vi.fn())

const mockMiddlewareClient = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    supabase: {
      auth: { getUser: mockGetUser },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockProfileSingle,
          }),
        }),
      }),
    },
    response: {} as Response,
  })
)

vi.mock("@/lib/supabase/middleware", () => ({
  createMiddlewareClient: mockMiddlewareClient,
}))

import { proxy } from "@/proxy"
import { createMockRequest } from "@/tests/utils/request-mock"

describe("proxy integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should pass through public API routes without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await proxy(createMockRequest("/api/health"))

    expect(result).toBeUndefined()
  })

  it("should pass through other public routes without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await proxy(createMockRequest("/api/products"))

    expect(result).toBeUndefined()
  })

  it("should pass through authenticated viewer on dashboard route", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-3" } },
      error: null,
    })

    const result = await proxy(createMockRequest("/dashboard"))

    expect(result).toBeUndefined()
  })

  it("should pass through authenticated admin on nested dashboard route", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })

    const result = await proxy(createMockRequest("/dashboard/products"))

    expect(result).toBeUndefined()
  })

  it("should redirect authenticated user from /login to dashboard when profile fetch returns null", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })
    mockProfileSingle.mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    })

    const result = await proxy(createMockRequest("/login"))

    expect(result).toBeInstanceOf(Response)
    expect(result!.status).toBe(307)
    const location = result!.headers.get("location")
    // When profile is null, role defaults to "viewer" → /dashboard
    expect(location).toContain("/dashboard")
  })
})
