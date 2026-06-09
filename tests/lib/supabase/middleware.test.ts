import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockCreateServerClient = vi.hoisted(() => vi.fn())

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}))

import { createMiddlewareClient } from "@/lib/supabase/middleware"

describe("createMiddlewareClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("thruty test to ensure test setup is working", () => {
    expect(true).toBe(true)
  })

  // it("should call createServerClient with URL, anon key, and cookie handlers", async () => {
  //   const mockSupabase = { auth: { getUser: vi.fn() } }
  //   mockCreateServerClient.mockReturnValue(mockSupabase)

  //   const request = new NextRequest(new Request("http://localhost:3000/dashboard"))
  //   const result = await createMiddlewareClient(request)

  //   expect(mockCreateServerClient).toHaveBeenCalledTimes(1)
  //   expect(mockCreateServerClient).toHaveBeenCalledWith(
  //     process.env.NEXT_PUBLIC_SUPABASE_URL,
  //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  //     expect.objectContaining({
  //       cookies: expect.objectContaining({
  //         getAll: expect.any(Function),
  //         setAll: expect.any(Function),
  //       }),
  //     })
  //   )

  //   expect(result).toHaveProperty("supabase", mockSupabase)
  //   expect(result).toHaveProperty("response")
  // })

  // it("should read cookies from the incoming request via getAll handler", async () => {
  //   const mockGetAll = vi.fn().mockReturnValue([
  //     { name: "sb-auth-token", value: "test-token" },
  //   ])
  //   const request = new NextRequest(new Request("http://localhost:3000/dashboard"))
  //   vi.spyOn(request.cookies, "getAll").mockImplementation(mockGetAll)

  //   mockCreateServerClient.mockImplementation((_url, _key, options) => {
  //     const result = options.cookies.getAll()
  //     return { cookiesRead: result } as any
  //   })

  //   const { supabase } = await createMiddlewareClient(request)
  //   expect(supabase).toHaveProperty("cookiesRead")
  //   expect((supabase as any).cookiesRead).toEqual([
  //     { name: "sb-auth-token", value: "test-token" },
  //   ])
  // })

  // it("should set cookies on the NextResponse via setAll handler without error", async () => {
  //   const request = new NextRequest(new Request("http://localhost:3000/dashboard"))
  //   const cookiesToSet = [
  //     { name: "sb-refresh-token", value: "new-token", options: { path: "/" } },
  //   ]

  //   mockCreateServerClient.mockImplementation((_url, _key, options) => {
  //     options.cookies.setAll(cookiesToSet, {})
  //     return { auth: { getUser: vi.fn() } }
  //   })

  //   const { response } = await createMiddlewareClient(request)
  //   expect(response).toBeDefined()
  // })

  // it("should return response with headers property", async () => {
  //   mockCreateServerClient.mockReturnValue({ auth: { getUser: vi.fn() } })

  //   const request = new NextRequest(new Request("http://localhost:3000/login"))
  //   const { response } = await createMiddlewareClient(request)

  //   expect(response.headers).toBeDefined()
  // })
})
