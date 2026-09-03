import { beforeEach, describe, expect, it, vi } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import {
  getCurrentExchangeRate,
  getExchangeRateHistory,
  setManualExchangeRate,
} from "@/lib/supabase/actions/tasas"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  getSession: vi.fn(),
}))

const mockSupabase = {
  from: vi.fn(),
}

const viewerSession = {
  data: {
    id: "user-1",
    email: "viewer@test.com",
    role: "viewer" as const,
    fullName: "User",
    isActive: true,
  },
}

const adminSession = {
  data: {
    id: "admin-1",
    email: "admin@test.com",
    role: "admin" as const,
    fullName: "Admin",
    isActive: true,
  },
}

describe("tasa de cambio actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(getSession).mockResolvedValue(viewerSession)
  })

  it("obtiene la tasa actual activa para usuarios autenticados", async () => {
    const rate = {
      id: "rate-1",
      moneda_origen: "USD",
      moneda_destino: "VES",
      tasa: 36.5,
      fuente: "api_bcv",
      fecha: "2026-09-01",
      activa: true,
      created_at: "2026-09-01T08:00:00Z",
    }

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: rate, error: null }),
    }

    mockSupabase.from.mockReturnValue(chain as never)

    const result = await getCurrentExchangeRate()

    expect(result).toEqual({ data: rate, error: null })
    expect(mockSupabase.from).toHaveBeenCalledWith("tasas_cambio")
    expect(chain.eq).toHaveBeenCalledWith("activa", true)
  })

  it("devuelve UNAUTHORIZED cuando el usuario no está autenticado", async () => {
    vi.mocked(getSession).mockResolvedValue({ data: null })

    const result = await getCurrentExchangeRate()

    expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
  })

  it("obtiene el historial de tasas con el rango solicitado", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-01T12:00:00Z"))

    const history = [
      { id: "rate-2", tasa: 36.8, fuente: "api_bcv", fecha: "2026-09-01", created_at: "2026-09-01T08:00:00Z", activa: true, moneda_origen: "USD", moneda_destino: "VES" },
      { id: "rate-1", tasa: 36.2, fuente: "manual", fecha: "2026-08-31", created_at: "2026-08-31T09:15:00Z", activa: false, moneda_origen: "USD", moneda_destino: "VES" },
    ]

    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => void) => resolve({ data: history, error: null }),
    }

    mockSupabase.from.mockReturnValue(chain as never)

    const result = await getExchangeRateHistory(2)

    expect(result).toEqual({ data: history, error: null })
    expect(chain.gte).toHaveBeenCalledWith("created_at", expect.stringMatching(/2026-08/))
    expect(chain.limit).toHaveBeenCalledWith(2)

    vi.useRealTimers()
  })

  it("registra una tasa manual y desactiva la anterior activa", async () => {
    const inserted = {
      id: "rate-3",
      moneda_origen: "USD",
      moneda_destino: "VES",
      tasa: 37.2,
      fuente: "manual",
      fecha: "2026-09-01",
      activa: true,
      created_at: "2026-09-01T09:30:00Z",
    }

    vi.mocked(getSession).mockResolvedValue(adminSession)

    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => void) => resolve({ error: null }),
    }

    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
    }

    mockSupabase.from
      .mockReturnValueOnce(updateChain as never)
      .mockReturnValueOnce(insertChain as never)

    const result = await setManualExchangeRate(37.2)

    expect(result).toEqual({ data: inserted, error: null })
    expect(updateChain.update).toHaveBeenCalledWith({ activa: false })
    expect(insertChain.single).toHaveBeenCalled()
  })
})
