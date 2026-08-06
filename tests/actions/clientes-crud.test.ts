import { beforeEach, describe, expect, it, vi } from "vitest"
import { getSession } from "@/actions/auth"
import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { createClient, listClientRecords, toggleClientActive, updateClient } from "@/lib/supabase/actions/clientes"

vi.mock("@/actions/auth", () => ({ getSession: vi.fn() }))
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let resolveValue: { data: unknown; error: unknown; count?: number } = { data: [], error: null, count: 0 }
const single = vi.fn()
const chain: Record<string, unknown> = {
  select: vi.fn(() => chain),
  or: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  order: vi.fn(() => chain),
  range: vi.fn(() => chain),
  insert: vi.fn(() => chain),
  update: vi.fn(() => chain),
  single,
  then: (resolve: (value: unknown) => void) => resolve(resolveValue),
}
const from = vi.fn(() => chain)
const admin = { data: { id: "admin", email: "admin@test.com", role: "admin" as const, fullName: "Admin", isActive: true } }
const seller = { data: { id: "seller", email: "seller@test.com", role: "seller" as const, fullName: "Seller", isActive: true } }

function clientForm(values: Record<string, string> = {}) {
  const data = new FormData()
  const defaults = { nombre: "Cliente de prueba", tipo: "natural", limite_credito: "0", ...values }
  Object.entries(defaults).forEach(([key, value]) => data.append(key, value))
  return data
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createSupabaseClient).mockResolvedValue({ from } as never)
  vi.mocked(getSession).mockResolvedValue(admin)
  resolveValue = { data: [], error: null, count: 0 }
  single.mockResolvedValue({ data: { id: "client-1" }, error: null })
})

describe("clientes CRUD server actions", () => {
  it("rejects unauthenticated list and mutations", async () => {
    vi.mocked(getSession).mockResolvedValue({ data: null })

    await expect(listClientRecords()).resolves.toEqual({ data: null, error: "UNAUTHORIZED" })
    await expect(createClient({}, clientForm())).resolves.toEqual({ message: "UNAUTHORIZED" })
    expect(from).not.toHaveBeenCalled()
  })

  it("forbids sellers from mutations", async () => {
    vi.mocked(getSession).mockResolvedValue(seller)

    await expect(createClient({}, clientForm())).resolves.toEqual({ message: "FORBIDDEN" })
    await expect(updateClient({}, clientForm({ id: "client-1" }))).resolves.toEqual({ message: "FORBIDDEN" })
    await expect(toggleClientActive({}, clientForm({ id: "client-1", activo: "false" }))).resolves.toEqual({ message: "FORBIDDEN" })
    expect(from).not.toHaveBeenCalled()
  })

  it("creates an admin client and normalizes blank optional values", async () => {
    const result = await createClient({}, clientForm({ telefono: "", email: "", direccion: "", rif_cedula: "", limite_credito: "250.50" }))

    expect(result).toEqual({ success: true, data: { id: "client-1" } })
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ telefono: null, email: null, direccion: null, rif_cedula: null, limite_credito: 250.5 }))
  })

  it("maps duplicate RIF to a field error", async () => {
    single.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate" } })

    await expect(createClient({}, clientForm({ rif_cedula: "V-123" }))).resolves.toEqual({ errors: { rif_cedula: ["Ya existe un cliente con ese RIF o cédula"] } })
  })

  it("updates a client without sending its id", async () => {
    resolveValue = { data: null, error: null }
    const result = await updateClient({}, clientForm({ id: "client-1", nombre: "Nombre actualizado", telefono: "" }))

    expect(result).toEqual({ success: true })
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Nombre actualizado", telefono: null }))
    const updateCalls = (chain.update as ReturnType<typeof vi.fn>).mock.calls as Array<[Record<string, unknown>]>
    expect(updateCalls[0][0].id).toBeUndefined()
    expect(chain.eq).toHaveBeenCalledWith("id", "client-1")
  })

  it("toggles client activation", async () => {
    resolveValue = { data: null, error: null }

    await expect(toggleClientActive({}, clientForm({ id: "client-1", activo: "false" }))).resolves.toEqual({ success: true })
    expect(chain.update).toHaveBeenCalledWith({ activo: false })
  })

  it("lists active clients by default and applies search, pagination, and inactive visibility", async () => {
    const rows = [{ id: "client-1", nombre: "Ana", activo: true }]
    resolveValue = { data: rows, error: null, count: 1 }

    await expect(listClientRecords({ search: "Ana", page: 2, pageSize: 5 })).resolves.toEqual({ data: { rows, total: 1, page: 2, pageSize: 5 }, error: null })
    expect(chain.or).toHaveBeenCalledWith("nombre.ilike.%Ana%,rif_cedula.ilike.%Ana%,telefono.ilike.%Ana%")
    expect(chain.eq).toHaveBeenCalledWith("activo", true)
    expect(chain.range).toHaveBeenCalledWith(5, 9)

    vi.clearAllMocks()
    vi.mocked(createSupabaseClient).mockResolvedValue({ from } as never)
    await listClientRecords({ includeInactive: true })
    expect(chain.eq).not.toHaveBeenCalledWith("activo", true)
  })
})
