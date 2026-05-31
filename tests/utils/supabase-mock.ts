import type { Role } from "@/lib/auth/types"

export interface MockUser {
  id: string
  email: string
}

export interface MockSession {
  user: MockUser | null
}

export interface MockProfile {
  id: string
  email: string
  role: Role
  full_name: string | null
  is_active: boolean
}

export function createMockSession(overrides?: Partial<MockSession>): MockSession {
  return {
    user: { id: "user-1", email: "admin@donamaria.com" },
    ...overrides,
  }
}

export function createMockProfile(overrides?: Partial<MockProfile>): MockProfile {
  return {
    id: "user-1",
    email: "admin@donamaria.com",
    role: "admin",
    full_name: "Admin",
    is_active: true,
    ...overrides,
  }
}
