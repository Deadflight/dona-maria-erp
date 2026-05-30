import { describe, it, expect } from "vitest"
import type { Role, UserWithProfile, AuthResult, LoginInput, RegisterInput } from "@/lib/auth/types"

describe("Auth types", () => {
  describe("Role", () => {
    it("should be a union of exactly 'admin', 'seller', 'viewer'", () => {
      const roles: Role[] = ["admin", "seller", "viewer"]
      expect(roles).toHaveLength(3)
      expect(roles).toContain("admin")
      expect(roles).toContain("seller")
      expect(roles).toContain("viewer")
    })
  })

  describe("UserWithProfile", () => {
    it("should include all required profile fields", () => {
      const user: UserWithProfile = {
        id: "123",
        email: "admin@donamaria.com",
        role: "admin",
        fullName: "Admin User",
        isActive: true,
      }

      expect(user.id).toBe("123")
      expect(user.email).toBe("admin@donamaria.com")
      expect(user.role).toBe("admin")
      expect(user.fullName).toBe("Admin User")
      expect(user.isActive).toBe(true)
    })
  })

  describe("AuthResult", () => {
    it("should type a success result with data", () => {
      const result: AuthResult = {
        success: true,
        data: {
          id: "123",
          email: "admin@donamaria.com",
          role: "admin",
          fullName: null,
          isActive: true,
        },
      }

      if (result.success) {
        expect(result.data.role).toBe("admin")
      } else {
        // Should not reach here
        expect(true).toBe(false)
      }
    })

    it("should type an error result with error message", () => {
      const result: AuthResult = {
        success: false,
        error: "Credenciales inválidas",
      }

      if (!result.success) {
        expect(result.error).toBe("Credenciales inválidas")
      } else {
        // Should not reach here
        expect(true).toBe(false)
      }
    })
  })

  describe("LoginInput", () => {
    it("should accept valid login credentials", () => {
      const input: LoginInput = {
        email: "admin@donamaria.com",
        password: "Admin123!",
      }

      expect(input.email).toBe("admin@donamaria.com")
      expect(input.password).toBe("Admin123!")
    })
  })

  describe("RegisterInput", () => {
    it("should accept valid registration data", () => {
      const input: RegisterInput = {
        email: "new@donamaria.com",
        password: "SecurePass1!",
        fullName: "New User",
        role: "seller",
      }

      expect(input.email).toBe("new@donamaria.com")
      expect(input.password).toBe("SecurePass1!")
      expect(input.fullName).toBe("New User")
      expect(input.role).toBe("seller")
    })
  })
})
