import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PaymentPanel } from "@/app/(pos)/pos/_components/payment-panel"

// ---------------------------------------------------------------------------
// Mock lucide-react icons (avoid SVG rendering issues in jsdom)
// ---------------------------------------------------------------------------

vi.mock("lucide-react", () => ({
  Banknote: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-banknote" {...props} />,
  CreditCard: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-creditcard" {...props} />,
  ArrowRightLeft: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-arrowrightleft" {...props} />,
  DollarSign: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-dollarsign" {...props} />,
}))

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  total: 50.0,
  paymentMethod: null as "efectivo" | "transferencia" | "credito" | null,
  clienteNombre: null,
  clienteLimiteCredito: null,
  clienteSaldoActual: null,
  isCreditoOverLimit: false,
  isCreditoWithoutClient: false,
  isEmpty: false,
  amountReceived: null,
  change: null,
  onSetPaymentMethod: vi.fn(),
  onSetAmountReceived: vi.fn(),
  onSetAmountToExact: vi.fn(),
  onConfirm: vi.fn(),
  isSubmitting: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PaymentPanel", () => {
  // ---------------------------------------------------------------------------
  // Payment method selection
  // ---------------------------------------------------------------------------
  describe("payment method selection", () => {
    it("renders all three payment method buttons", () => {
      render(<PaymentPanel {...defaultProps} />)

      expect(screen.getByText("Efectivo")).toBeInTheDocument()
      expect(screen.getByText("Transferencia")).toBeInTheDocument()
      expect(screen.getByText("Crédito")).toBeInTheDocument()
    })

    it("calls onSetPaymentMethod when clicking a method", async () => {
      const user = userEvent.setup()
      const onSetPaymentMethod = vi.fn()

      render(
        <PaymentPanel {...defaultProps} onSetPaymentMethod={onSetPaymentMethod} />,
      )

      await user.click(screen.getByText("Efectivo"))
      expect(onSetPaymentMethod).toHaveBeenCalledWith("efectivo")
    })

    it("calls onSetPaymentMethod with transferencia", async () => {
      const user = userEvent.setup()
      const onSetPaymentMethod = vi.fn()

      render(
        <PaymentPanel {...defaultProps} onSetPaymentMethod={onSetPaymentMethod} />,
      )

      await user.click(screen.getByText("Transferencia"))
      expect(onSetPaymentMethod).toHaveBeenCalledWith("transferencia")
    })

    it("calls onSetPaymentMethod with credito", async () => {
      const user = userEvent.setup()
      const onSetPaymentMethod = vi.fn()

      render(
        <PaymentPanel {...defaultProps} onSetPaymentMethod={onSetPaymentMethod} />,
      )

      await user.click(screen.getByText("Crédito"))
      expect(onSetPaymentMethod).toHaveBeenCalledWith("credito")
    })
  })

  // ---------------------------------------------------------------------------
  // Change calculation display
  // ---------------------------------------------------------------------------
  describe("change calculation", () => {
    it("shows change when payment is efectivo and amount received exceeds total", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="efectivo"
          amountReceived={60}
          change={10}
        />,
      )

      expect(screen.getByText("Cambio: $10.00")).toBeInTheDocument()
    })

    it("shows shortfall when payment is efectivo and amount is insufficient", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="efectivo"
          amountReceived={30}
          change={-20}
        />,
      )

      expect(screen.getByText("Faltan $20.00")).toBeInTheDocument()
    })

    it("does not show change for non-efectivo payment", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="transferencia"
          amountReceived={60}
          change={10}
        />,
      )

      expect(screen.queryByText(/Cambio/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Faltan/)).not.toBeInTheDocument()
    })

    it("shows cash input only for efectivo payment", () => {
      const { rerender } = render(
        <PaymentPanel {...defaultProps} paymentMethod="efectivo" />,
      )

      expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument()

      rerender(
        <PaymentPanel {...defaultProps} paymentMethod="transferencia" />,
      )

      expect(screen.queryByPlaceholderText("0.00")).not.toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Confirm button state
  // ---------------------------------------------------------------------------
  describe("confirm button", () => {
    it("disables confirm when cart is empty", () => {
      render(
        <PaymentPanel {...defaultProps} isEmpty={true} paymentMethod="efectivo" />,
      )

      const btn = screen.getByRole("button", { name: /Confirmar venta/ })
      expect(btn).toBeDisabled()
    })

    it("disables confirm when no payment method selected", () => {
      render(
        <PaymentPanel {...defaultProps} paymentMethod={null} isEmpty={false} />,
      )

      const btn = screen.getByRole("button", { name: /Confirmar venta/ })
      expect(btn).toBeDisabled()
    })

    it("disables confirm when credito without client", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="credito"
          isCreditoWithoutClient={true}
          isEmpty={false}
        />,
      )

      const btn = screen.getByRole("button", { name: /Confirmar venta/ })
      expect(btn).toBeDisabled()
    })

    it("disables confirm when submitting", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="efectivo"
          isEmpty={false}
          isSubmitting={true}
        />,
      )

      expect(screen.getByText("Procesando...")).toBeInTheDocument()
    })

    it("enables confirm when all conditions met", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="efectivo"
          isEmpty={false}
          isCreditoWithoutClient={false}
          isSubmitting={false}
        />,
      )

      const btn = screen.getByRole("button", { name: /Confirmar venta/ })
      expect(btn).not.toBeDisabled()
    })

    it("disables confirm when credit is over the client limit", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="credito"
          clienteNombre="María González"
          isCreditoWithoutClient={false}
          isCreditoOverLimit={true}
          isEmpty={false}
        />,
      )

      const btn = screen.getByRole("button", { name: /Confirmar venta/ })
      expect(btn).toBeDisabled()
    })

    it("enables confirm for credito within the client limit", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="credito"
          clienteNombre="María González"
          isCreditoWithoutClient={false}
          isCreditoOverLimit={false}
          isEmpty={false}
        />,
      )

      const btn = screen.getByRole("button", { name: /Confirmar venta/ })
      expect(btn).not.toBeDisabled()
    })

    it("calls onConfirm when clicked", async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()

      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="efectivo"
          isEmpty={false}
          isCreditoWithoutClient={false}
          onConfirm={onConfirm}
        />,
      )

      await user.click(screen.getByRole("button", { name: /Confirmar venta/ }))
      expect(onConfirm).toHaveBeenCalledOnce()
    })

    it("shows total in confirm button text", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          total={150.75}
          paymentMethod="efectivo"
          isEmpty={false}
        />,
      )

      expect(screen.getByText(/Confirmar venta.*\$150\.75/)).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Credito warning
  // ---------------------------------------------------------------------------
  describe("credito warning", () => {
    it("shows warning when credito selected without client", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="credito"
          isCreditoWithoutClient={true}
        />,
      )

      expect(
        screen.getByText("Selecciona un cliente para venta a crédito"),
      ).toBeInTheDocument()
    })

    it("does not show warning when client is selected", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="credito"
          clienteNombre="María González"
          isCreditoWithoutClient={false}
        />,
      )

      expect(
        screen.queryByText("Selecciona un cliente para venta a crédito"),
      ).not.toBeInTheDocument()
    })

    it("shows client name badge for credito with client", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="credito"
          clienteNombre="María González"
          isCreditoWithoutClient={false}
        />,
      )

      expect(screen.getByText("María González")).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Over-limit credit warning
  // ---------------------------------------------------------------------------
  describe("over-limit credit warning", () => {
    it("shows balance and limit via formatCurrency when over limit", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          total={100}
          paymentMethod="credito"
          clienteNombre="María González"
          clienteSaldoActual={950}
          clienteLimiteCredito={1000}
          isCreditoOverLimit={true}
        />,
      )

      expect(
        screen.getByText("El cliente excede su límite de crédito"),
      ).toBeInTheDocument()
      expect(screen.getByText(/Bs\. 950,00/)).toBeInTheDocument()
      expect(screen.getByText(/Bs\. 100,00/)).toBeInTheDocument()
      expect(screen.getByText(/Bs\. 1\.000,00/)).toBeInTheDocument()
    })

    it("does not show over-limit warning when within the client limit", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          paymentMethod="credito"
          clienteNombre="María González"
          clienteSaldoActual={50}
          clienteLimiteCredito={1000}
          isCreditoOverLimit={false}
        />,
      )

      expect(
        screen.queryByText("El cliente excede su límite de crédito"),
      ).not.toBeInTheDocument()
    })
  })
})
