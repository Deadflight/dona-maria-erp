import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRegisterAbono = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/actions/creditos", () => ({
  registerAbono: mockRegisterAbono,
}))

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}))

import type { CreditListItem } from "@/lib/supabase/actions/creditos"
import { AbonoDialog } from "@/app/(dashboard)/credits/_components/abono-dialog"

const credit: CreditListItem = {
  id: "cred-1",
  cliente_id: "cli-1",
  created_at: "2026-07-01T10:00:00.000Z",
  cuotas: 1,
  estado: "activo",
  fecha_otorgamiento: "2026-07-01",
  fecha_vencimiento: "2026-08-15",
  monto_original: 500,
  saldo_pendiente: 300,
  tasa_interes: 0,
  venta_id: null,
  clientes: { nombre: "María Pérez" },
}

describe("AbonoDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks an overpayment without calling register_abono", async () => {
    const user = userEvent.setup()
    render(<AbonoDialog credit={credit} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText("Monto"), "500")
    await user.click(screen.getByRole("button", { name: "Registrar abono" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      /no puede superar el saldo pendiente/i,
    )
    expect(mockRegisterAbono).not.toHaveBeenCalled()
  })

  it("submits a valid abono, calling register_abono with the form data", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    mockRegisterAbono.mockResolvedValue({
      success: true,
      data: {
        credito_id: "cred-1",
        saldo_pendiente: 0,
        saldo_actual: 0,
        estado: "cancelado",
      },
    })

    render(<AbonoDialog credit={credit} onClose={onClose} />)

    await user.type(screen.getByLabelText("Monto"), "300")
    await user.click(screen.getByRole("button", { name: "Registrar abono" }))

    await waitFor(() => expect(mockRegisterAbono).toHaveBeenCalledTimes(1))

    // The action receives (prevState, formData); revalidatePath("/credits")
    // runs inside registerAbono and is asserted at the action layer (T7).
    const formData = mockRegisterAbono.mock.calls[0][1] as FormData
    expect(formData.get("credito_id")).toBe("cred-1")
    expect(formData.get("monto")).toBe("300")
    expect(formData.get("metodo_pago")).toBe("efectivo")

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(mockToastSuccess).toHaveBeenCalled()
  })
})
