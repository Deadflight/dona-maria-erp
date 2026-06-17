import type { NextRequest } from "next/server"

/**
 * Minimal subset of `NextRequest` that the proxy() handler actually reads.
 * Keeping it narrow lets proxy tests stay typed without re-implementing the
 * whole `NextRequest` surface (cookies, headers, geo, etc.) just to satisfy
 * the type checker.
 */
export type MockRequest = Pick<NextRequest, "nextUrl" | "url">

/**
 * Builds a fake request suitable for unit-testing the Next.js middleware/proxy
 * function. Only the fields read by `proxy.ts` are populated.
 */
export function createMockRequest(
  pathname: string,
  url = "http://localhost:3000",
): MockRequest {
  return {
    nextUrl: { pathname } as NextRequest["nextUrl"],
    url,
  }
}
