import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockLoginAction = vi.hoisted(() => vi.fn())
vi.mock("@/app/login/actions", () => ({
  loginAction: mockLoginAction,
}))

import LoginPage from "@/app/login/page"

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render the login form with card title", () => {
    render(<LoginPage />)

    const titles = screen.getAllByText("Iniciar Sesión")
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it("should render email input with Spanish label", () => {
    render(<LoginPage />)

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
  })

  it("should render password input with Spanish label", () => {
    render(<LoginPage />)

    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument()
  })

  it("should render submit button with Iniciar Sesión text", () => {
    render(<LoginPage />)

    const button = screen.getByRole("button", { name: "Iniciar Sesión" })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it("should render the form with email input", () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText("admin@donamaria.com")).toBeInTheDocument()
  })
})
