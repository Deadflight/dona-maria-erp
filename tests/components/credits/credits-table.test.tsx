import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// The dialog is exercised in abono-dialog.test.tsx (T13/T14). The table test
// keeps the list contract in focus and does not open the real dialog.
vi.mock("@/app/(dashboard)/credits/_components/abono-dialog", () => ({
  AbonoDialog: () => null,
}))

import type { Role } from "@/lib/auth/types"
import type { CreditListItem } from "@/lib/supabase/actions/creditos"
import { CreditsTable } from "@/app/(dashboard)/credits/_components/credits-table"

type Session = {
  id: string
  email: string
  role: Role
  fullName: string | null
  isActive: boolean
}

const adminSession: Session = {
  id: "u-1",
  email: "admin@donamaria.com",
  role: "admin",
  fullName: "Admin",
  isActive: true,
}
const sellerSession: Session = { ...adminSession, role: "seller" }
const viewerSession: Session = { ...adminSession, role: "viewer" }

function makeCredit(overrides: Partial<CreditListItem> = {}): CreditListItem {
  return {
    id: "cred-1",
    cliente_id: "cli-1",
    created_at: "2026-07-01T10:00:00.000Z",
    cuotas: 1,
    estado: "activo",
    fecha_otorgamiento: "2026-07-01",
    fecha_vencimiento: "2026-08-15",
    monto_original: 1234.5,
    saldo_pendiente: 800,
    tasa_interes: 0,
    venta_id: null,
    clientes: { nombre: "María Pérez" },
    ...overrides,
  }
}

// Mirrors the implementation's es-VE date formatting so the assertion stays
// robust across ICU versions. Parses YYYY-MM-DD as LOCAL midnight to avoid the
// UTC parse shifting the day by one in UTC-negative timezones.
const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day))
}

describe("CreditsTable", () => {
  it("renders client name, formatted amounts, due date and the derived vencido badge", () => {
    // The `vencido` state is derived server-side by listCreditos (decision 5);
    // the UI only displays the estado it receives and never mutates the row.
    const credit = makeCredit({ estado: "vencido" })

    render(
      <CreditsTable data={[credit]} error={null} session={adminSession} />,
    )

    expect(screen.getByText("María Pérez")).toBeInTheDocument()
    expect(screen.getByText("Bs. 1.234,50")).toBeInTheDocument() // monto_original
    expect(screen.getByText("Bs. 800,00")).toBeInTheDocument() // saldo_pendiente
    expect(screen.getByText(formatDate("2026-08-15"))).toBeInTheDocument()
    expect(screen.getByText("Vencido")).toBeInTheDocument()
  })

  it("renders a Cancelado badge for canceled credits", () => {
    render(
      <CreditsTable
        data={[makeCredit({ estado: "cancelado", saldo_pendiente: 0 })]}
        error={null}
        session={adminSession}
      />,
    )

    expect(screen.getByText("Cancelado")).toBeInTheDocument()
  })

  it("renders an Activo badge for active credits", () => {
    render(
      <CreditsTable data={[makeCredit()]} error={null} session={adminSession} />,
    )

    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it("renders an empty state when there are no credits", () => {
    render(<CreditsTable data={[]} error={null} session={adminSession} />)

    expect(screen.getByText("Aún no hay créditos registrados.")).toBeInTheDocument()
    expect(screen.queryByText("María Pérez")).not.toBeInTheDocument()
  })

  it("shows the Abono action for admins", () => {
    render(
      <CreditsTable data={[makeCredit()]} error={null} session={adminSession} />,
    )

    expect(screen.getAllByRole("button", { name: "Abono" })).toHaveLength(1)
  })

  it("shows the Abono action for sellers", () => {
    render(
      <CreditsTable data={[makeCredit()]} error={null} session={sellerSession} />,
    )

    expect(screen.getAllByRole("button", { name: "Abono" })).toHaveLength(1)
  })

  it("keeps the list read-only for viewers", () => {
    render(
      <CreditsTable data={[makeCredit()]} error={null} session={viewerSession} />,
    )

    // Viewer still sees the list (REQ-CREDITS-UI-3)...
    expect(screen.getByText("María Pérez")).toBeInTheDocument()
    // ...but no abono action is available.
    expect(screen.queryByRole("button", { name: "Abono" })).not.toBeInTheDocument()
  })
})
