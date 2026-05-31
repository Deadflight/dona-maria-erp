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
    response: {} as any,
  })
)

vi.mock("@/lib/supabase/middleware", () => ({
  createMiddlewareClient: mockMiddlewareClient,
}))

import { proxy } from "@/proxy"

function mockRequest(pathname: string): any {
  return {
    nextUrl: { pathname },
    url: "http://localhost:3000",
  }
}

describe("proxy integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should pass through public API routes without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await proxy(mockRequest("/api/health"))

    expect(result).toBeUndefined()
  })

  it("should pass through other public routes without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await proxy(mockRequest("/api/products"))

    expect(result).toBeUndefined()
  })

  it("should pass through authenticated viewer on dashboard route", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-3" } },
      error: null,
    })

    const result = await proxy(mockRequest("/dashboard"))

    expect(result).toBeUndefined()
  })

  it("should pass through authenticated admin on nested dashboard route", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })

    const result = await proxy(mockRequest("/dashboard/products"))

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

    const result = await proxy(mockRequest("/login"))

    expect(result).toBeInstanceOf(Response)
    expect(result!.status).toBe(307)
    const location = result!.headers.get("location")
    // When profile is null, role defaults to "viewer" → /dashboard
    expect(location).toContain("/dashboard")
  })
})
