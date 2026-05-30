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
  rol: Role
  nombre: string | null
  activo: boolean
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
    rol: "admin",
    nombre: "Admin",
    activo: true,
    ...overrides,
  }
}
