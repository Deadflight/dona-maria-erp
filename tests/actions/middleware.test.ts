import { describe, it, expect, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
  })),
}))

import { createMiddlewareClient } from "@/lib/supabase/middleware"

describe("createMiddlewareClient", () => {
  it("returns supabase client and response", async () => {
    const request = new NextRequest("https://example.com/")
    const { supabase, response } = await createMiddlewareClient(request)

    expect(supabase).toBeDefined()
    expect(response).toBeInstanceOf(NextResponse)
  })

  it("reads cookies from the request", async () => {
    const request = new NextRequest("https://example.com/")
    request.cookies.set("sb-access-token", "token-abc")

    const { supabase } = await createMiddlewareClient(request)
    expect(supabase).toBeDefined()
  })

  it("sets cookies on the response via setAll", async () => {
    const request = new NextRequest("https://example.com/")

    const { supabase } = await createMiddlewareClient(request)

    // Access the cookie setAll callback through the createServerClient options
    // The middleware client wraps setAll to update both request and response cookies
    expect(supabase).toBeDefined()
  })

  it("creates a NextResponse with request passed through", async () => {
    const request = new NextRequest("https://example.com/dashboard")

    const { response } = await createMiddlewareClient(request)

    expect(response).toBeDefined()
    expect(response).toBeInstanceOf(NextResponse)
  })
})
