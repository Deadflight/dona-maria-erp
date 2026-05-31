import { describe, it, expect, vi, beforeEach } from "vitest"

const mockCreateClient = vi.hoisted(() => vi.fn())

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}))

import { createAdminClient } from "@/lib/supabase/admin"

describe("createAdminClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call createClient with URL and SERVICE_ROLE_KEY", () => {
    const mockClient = { auth: { admin: { createUser: vi.fn() } } }
    mockCreateClient.mockReturnValue(mockClient)

    const result = createAdminClient()

    expect(mockCreateClient).toHaveBeenCalledTimes(1)
    expect(mockCreateClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    expect(result).toBe(mockClient)
  })

  it("should not use cookie-related options (no SSR)", () => {
    const mockClient = { auth: { admin: { createUser: vi.fn() } } }
    mockCreateClient.mockReturnValue(mockClient)

    createAdminClient()

    const callArgs = mockCreateClient.mock.calls[0]
    expect(callArgs).toHaveLength(2)
  })

  it("should return a SupabaseClient that can call admin.createUser", () => {
    const mockClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "123", email: "test@test.com" } },
            error: null,
          }),
        },
      },
    }
    mockCreateClient.mockReturnValue(mockClient)

    const client = createAdminClient()
    expect(client.auth.admin.createUser).toBeDefined()
  })
})
