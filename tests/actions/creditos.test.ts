import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { revalidatePath } from "next/cache"
import {
  listCreditos,
  registerAbono,
} from "@/lib/supabase/actions/creditos"
import { resolveCreditEstado } from "@/lib/creditos"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock Supabase chain builders
// ---------------------------------------------------------------------------

const VALID_CREDITO_ID = "550e8400-e29b-41d4-a716-446655440001"

let creditosResolveValue: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

const mockCreditosChain: Record<string, unknown> = {
  select: vi.fn(() => mockCreditosChain),
  order: vi.fn(() => mockCreditosChain),
  then: (resolve: (v: unknown) => void) => resolve(creditosResolveValue),
}

const mockRpc = vi.fn()

const mockFrom = vi.fn((table: string) => {
  if (table === "creditos") return mockCreditosChain
  throw new Error(`Unexpected table: ${table}`)
})

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
}

// ---------------------------------------------------------------------------
// Default session values
// ---------------------------------------------------------------------------

const sellerSession = {
  data: {
    id: "seller-1",
    email: "seller@test.com",
    role: "seller" as const,
    fullName: "Seller User",
    isActive: true,
  },
}

const adminSession = {
  data: {
    id: "admin-1",
    email: "admin@test.com",
    role: "admin" as const,
    fullName: "Admin User",
    isActive: true,
  },
}

const viewerSession = {
  data: {
    id: "viewer-1",
    email: "viewer@test.com",
    role: "viewer" as const,
    fullName: "Viewer User",
    isActive: true,
  },
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function abonoForm(values: Record<string, string> = {}) {
  const data = new FormData()
  const defaults = {
    credito_id: VALID_CREDITO_ID,
    monto: "300",
    metodo_pago: "efectivo",
    ...values,
  }
  Object.entries(defaults).forEach(([key, value]) => data.append(key, value))
  return data
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSession).mockReset()
  vi.mocked(createClient).mockReset()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  vi.mocked(getSession).mockResolvedValue(sellerSession)
  creditosResolveValue = { data: [], error: null }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("creditos Server Actions", () => {
  // ---------------------------------------------------------------------------
  // listCreditos
  // ---------------------------------------------------------------------------
  describe("listCreditos", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await listCreditos()

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("allows viewer role to list credits (read-only access)", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)
      creditosResolveValue = {
        data: [
          {
            id: "credit-1",
            estado: "activo",
            saldo_pendiente: 500,
            fecha_vencimiento: "2026-09-01",
          },
        ],
        error: null,
      }

      const result = await listCreditos()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0]?.id).toBe("credit-1")
    })

    it("derives vencido for overdue credits with pending balance and keeps others", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)
      creditosResolveValue = {
        data: [
          {
            id: "credit-overdue",
            estado: "activo",
            saldo_pendiente: 500,
            fecha_vencimiento: "2020-01-01",
          },
          {
            id: "credit-future",
            estado: "activo",
            saldo_pendiente: 300,
            fecha_vencimiento: "2999-01-01",
          },
          {
            id: "credit-canceled",
            estado: "cancelado",
            saldo_pendiente: 0,
            fecha_vencimiento: "2020-01-01",
          },
        ],
        error: null,
      }

      const result = await listCreditos()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(3)
      const byId = Object.fromEntries(
        (result.data ?? []).map((row) => [row.id, row.estado]),
      )
      expect(byId["credit-overdue"]).toBe("vencido")
      expect(byId["credit-future"]).toBe("activo")
      expect(byId["credit-canceled"]).toBe("cancelado")
    })

    it("selects client name and orders by most recent first", async () => {
      const result = await listCreditos()

      expect(result.error).toBeNull()
      expect(mockFrom).toHaveBeenCalledWith("creditos")
      expect(mockCreditosChain.select).toHaveBeenCalledWith(
        "*, clientes(nombre)",
      )
      expect(mockCreditosChain.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      })
    })

    it("returns error when Supabase query fails", async () => {
      creditosResolveValue = {
        data: null,
        error: { message: "DB error" },
      }

      const result = await listCreditos()

      expect(result).toEqual({ data: null, error: "DB error" })
    })
  })

  // ---------------------------------------------------------------------------
  // resolveCreditEstado (pure derivation helper)
  // ---------------------------------------------------------------------------
  describe("resolveCreditEstado", () => {
    const today = new Date("2026-08-06")

    it("marks overdue credit with pending balance as vencido", () => {
      expect(
        resolveCreditEstado("activo", 500, "2026-08-01", today),
      ).toBe("vencido")
    })

    it("keeps active when due today (strictly before current date)", () => {
      expect(
        resolveCreditEstado("activo", 500, "2026-08-06", today),
      ).toBe("activo")
    })

    it("keeps active when due in the future", () => {
      expect(
        resolveCreditEstado("activo", 300, "2026-09-01", today),
      ).toBe("activo")
    })

    it("keeps cancelado when balance is settled even if past due", () => {
      expect(
        resolveCreditEstado("cancelado", 0, "2026-07-01", today),
      ).toBe("cancelado")
    })
  })

  // ---------------------------------------------------------------------------
  // registerAbono
  // ---------------------------------------------------------------------------
  describe("registerAbono", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await registerAbono({}, abonoForm())

      expect(result).toEqual({ message: "UNAUTHORIZED" })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("returns FORBIDDEN for viewer role", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)

      const result = await registerAbono({}, abonoForm())

      expect(result).toEqual({ message: "FORBIDDEN" })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("calls register_abono RPC with correct shape and revalidates /credits", async () => {
      mockRpc.mockResolvedValue({
        data: {
          credito_id: VALID_CREDITO_ID,
          saldo_pendiente: 500,
          saldo_actual: 500,
          estado: "activo",
        },
        error: null,
      })

      const result = await registerAbono({}, abonoForm())

      expect(result).toEqual({
        success: true,
        data: {
          credito_id: VALID_CREDITO_ID,
          saldo_pendiente: 500,
          saldo_actual: 500,
          estado: "activo",
        },
      })
      expect(mockRpc).toHaveBeenCalledWith("register_abono", {
        p_credito_id: VALID_CREDITO_ID,
        p_monto: 300,
        p_metodo_pago: "efectivo",
        p_referencia: null,
      })
      expect(revalidatePath).toHaveBeenCalledWith("/credits")
    })

    it("allows admin role to register abonos", async () => {
      vi.mocked(getSession).mockResolvedValue(adminSession)
      mockRpc.mockResolvedValue({
        data: {
          credito_id: VALID_CREDITO_ID,
          saldo_pendiente: 0,
          saldo_actual: 0,
          estado: "cancelado",
        },
        error: null,
      })

      const result = await registerAbono({}, abonoForm({ monto: "500" }))

      expect(result).toEqual({
        success: true,
        data: {
          credito_id: VALID_CREDITO_ID,
          saldo_pendiente: 0,
          saldo_actual: 0,
          estado: "cancelado",
        },
      })
      expect(mockRpc).toHaveBeenCalledWith("register_abono", {
        p_credito_id: VALID_CREDITO_ID,
        p_monto: 500,
        p_metodo_pago: "efectivo",
        p_referencia: null,
      })
    })

    it("normalizes blank referencia to null in the RPC args", async () => {
      mockRpc.mockResolvedValue({
        data: {
          credito_id: VALID_CREDITO_ID,
          saldo_pendiente: 100,
          saldo_actual: 100,
          estado: "activo",
        },
        error: null,
      })

      await registerAbono({}, abonoForm({ referencia: "" }))

      expect(mockRpc).toHaveBeenCalledWith("register_abono", {
        p_credito_id: VALID_CREDITO_ID,
        p_monto: 300,
        p_metodo_pago: "efectivo",
        p_referencia: null,
      })
    })

    it("passes a provided referencia through to the RPC", async () => {
      mockRpc.mockResolvedValue({
        data: {
          credito_id: VALID_CREDITO_ID,
          saldo_pendiente: 100,
          saldo_actual: 100,
          estado: "activo",
        },
        error: null,
      })

      await registerAbono({}, abonoForm({ referencia: "TRF-001" }))

      expect(mockRpc).toHaveBeenCalledWith("register_abono", {
        p_credito_id: VALID_CREDITO_ID,
        p_monto: 300,
        p_metodo_pago: "efectivo",
        p_referencia: "TRF-001",
      })
    })

    it("returns field errors and skips the RPC on invalid monto", async () => {
      const result = await registerAbono({}, abonoForm({ monto: "0" }))

      expect(result.success).toBeUndefined()
      expect(result.errors?.monto).toBeTruthy()
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("returns field errors and skips the RPC on invalid metodo_pago", async () => {
      const result = await registerAbono(
        {},
        abonoForm({ metodo_pago: "tarjeta" }),
      )

      expect(result.errors).toHaveProperty("metodo_pago")
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("returns message when the RPC fails", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "El abono excede el saldo pendiente" },
      })

      const result = await registerAbono({}, abonoForm({ monto: "500" }))

      expect(result).toEqual({
        message: "El abono excede el saldo pendiente",
      })
    })
  })
})
