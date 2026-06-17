import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetSession = vi.hoisted(() => vi.fn())
const mockRedirect = vi.hoisted(() => vi.fn())

vi.mock("@/actions/auth", () => ({
  getSession: mockGetSession,
}))

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}))

vi.mock("@/lib/supabase/actions/inventario", () => ({
  getStockAlertCount: vi.fn().mockResolvedValue({ data: 5, error: null }),
}))

import DashboardLayout from "@/app/(dashboard)/layout"

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT")
    })
  })

  it("should redirect to /login when no session exists", async () => {
    mockGetSession.mockResolvedValue({ data: null })

    await expect(
      DashboardLayout({ children: <div>Content</div> })
    ).rejects.toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("should render layout when session exists without throwing redirect", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: "user-1",
        email: "admin@donamaria.com",
        role: "admin",
        fullName: "Admin",
        isActive: true,
      },
    })

    let result: React.ReactElement | null = null
    let error: Error | null = null
    try {
      result = await DashboardLayout({ children: <div>Content</div> }) as unknown as React.ReactElement
    } catch (e) {
      error = e as Error
    }

    expect(error).toBeNull()
    expect(result).toBeDefined()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("should pass children through when session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: "user-1",
        email: "admin@donamaria.com",
        role: "admin",
        fullName: "Admin",
        isActive: true,
      },
    })

    const result = (await DashboardLayout({
      children: <div>Content</div>,
    })) as unknown as React.ReactElement

    expect(result).toBeDefined()
    // Children should be somewhere in the rendered output
    expect(result.props.children).toBeDefined()
  })
})
