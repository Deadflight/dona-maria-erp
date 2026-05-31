import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetSession = vi.hoisted(() => vi.fn())
const mockRedirect = vi.hoisted(() => vi.fn())

vi.mock("@/actions/auth", () => ({
  getSession: mockGetSession,
}))

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}))

import Home from "@/app/page"

describe("Home (root page)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT")
    })
  })

  it("should redirect admin to /dashboard", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: "user-1",
        email: "admin@donamaria.com",
        role: "admin",
        fullName: "Admin",
        isActive: true,
      },
    })

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard")
  })

  it("should redirect seller to /pos", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: "user-2",
        email: "vendedor@donamaria.com",
        role: "seller",
        fullName: "Vendedor",
        isActive: true,
      },
    })

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/pos")
  })

  it("should redirect viewer to /dashboard", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: "user-3",
        email: "visor@donamaria.com",
        role: "viewer",
        fullName: "Visor",
        isActive: true,
      },
    })

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard")
  })

  it("should redirect to /login when no session", async () => {
    mockGetSession.mockResolvedValue({ data: null })

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })
})
