import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/middleware"
import type { Role } from "@/lib/auth/types"

export const proxyConfig = {
  matcher: ["/dashboard/:path*", "/login"],
}

export async function proxy(
  request: NextRequest
): Promise<Response | undefined> {
  const { supabase } = await createMiddlewareClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // No session — only allow /login
  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return undefined
  }

  // Has session — redirect away from /login
  if (pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role: Role = profile?.role ?? "viewer"
    const redirectTo = role === "seller" ? "/pos" : "/dashboard"
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Authenticated on a protected route — allow
  return undefined
}
