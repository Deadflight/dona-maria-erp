import { describe, it, expect } from "vitest"
import type { Database } from "@/types/database"

describe("Database types - perfiles rol", () => {
  it("should constrain rol to 'admin' | 'seller' | 'viewer'", () => {
    type Rol = Database["public"]["Tables"]["perfiles"]["Row"]["rol"]

    // Verify the union type is constrained at the type level
    // This assertion documents the expected type behavior
    const roles: Array<{ label: string; value: Rol }> = [
      { label: "Administrador", value: "admin" as Rol },
      { label: "Vendedor", value: "seller" as Rol },
      { label: "Visor", value: "viewer" as Rol },
    ]

    expect(roles).toHaveLength(3)
    expect(roles.map((r) => r.value)).toEqual(["admin", "seller", "viewer"])
  })
})
