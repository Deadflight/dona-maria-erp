import { NextRequest } from "next/server"

/**
 * Builds a fake request suitable for unit-testing the Next.js middleware/proxy
 * function. Using a real `NextRequest` keeps tests aligned with the contract
 * consumed by `proxy()`.
 */
export function createMockRequest(
  pathname: string,
  url = "http://localhost:3000",
): NextRequest {
  return new NextRequest(new URL(pathname, url))
}
