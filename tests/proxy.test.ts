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

import { proxy, proxyConfig } from "@/proxy"

function mockRequest(pathname: string): any {
  return {
    nextUrl: { pathname },
    url: "http://localhost:3000",
  }
}

describe("proxyConfig", () => {
  it("should export proxyConfig with matcher for dashboard and login", () => {
    expect(proxyConfig).toBeDefined()
    expect(proxyConfig.matcher).toBeDefined()
  })
})

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should redirect to /login when accessing /dashboard without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await proxy(mockRequest("/dashboard"))

    expect(result).toBeInstanceOf(Response)
    expect(result!.status).toBe(307)
    const location = result!.headers.get("location")
    expect(location).toContain("/login")
  })

  it("should redirect to /login when accessing nested dashboard route without session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await proxy(mockRequest("/dashboard/products"))

    expect(result).toBeInstanceOf(Response)
    expect(result!.status).toBe(307)
    const location = result!.headers.get("location")
    expect(location).toContain("/login")
  })

  it("should redirect admin to /dashboard when accessing /login with session", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@donamaria.com" } },
      error: null,
    })
    mockProfileSingle.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    })

    const result = await proxy(mockRequest("/login"))

    expect(result).toBeInstanceOf(Response)
    expect(result!.status).toBe(307)
    const location = result!.headers.get("location")
    expect(location).toContain("/dashboard")
  })

  it("should redirect seller to /pos when accessing /login with session", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    })
    mockProfileSingle.mockResolvedValue({
      data: { role: "seller" },
      error: null,
    })

    const result = await proxy(mockRequest("/login"))

    expect(result).toBeInstanceOf(Response)
    expect(result!.status).toBe(307)
    const location = result!.headers.get("location")
    expect(location).toContain("/pos")
  })

  it("should redirect viewer to /dashboard when accessing /login with session", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-3" } },
      error: null,
    })
    mockProfileSingle.mockResolvedValue({
      data: { role: "viewer" },
      error: null,
    })

    const result = await proxy(mockRequest("/login"))

    expect(result).toBeInstanceOf(Response)
    expect(result!.status).toBe(307)
    const location = result!.headers.get("location")
    expect(location).toContain("/dashboard")
  })

  it("should return undefined for authenticated user on dashboard route", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })

    const result = await proxy(mockRequest("/dashboard"))

    expect(result).toBeUndefined()
  })

  it("should return undefined for unauthenticated user on /login (pass through)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await proxy(mockRequest("/login"))

    expect(result).toBeUndefined()
  })
})
