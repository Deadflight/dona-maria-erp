import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginForm from "@/app/login/login-form"
import { useRouter } from "next/navigation"

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}))

vi.mock("@/app/login/actions", () => ({
  loginAction: vi.fn(),
}))

import { loginAction } from "@/app/login/actions"

const mockPush = vi.fn()
vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LoginForm", () => {
  it("renders email and password inputs", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Iniciar Sesión" })).toBeInTheDocument()
  })

  it("displays error message when login fails", async () => {
    const user = userEvent.setup()
    vi.mocked(loginAction).mockResolvedValue({ error: "Credenciales inválidas" })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText("Correo electrónico")
    const passwordInput = screen.getByLabelText("Contraseña")

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar Sesión" }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Credenciales inválidas")
    })
  })

  it("redirects on successful login", async () => {
    const user = userEvent.setup()
    vi.mocked(loginAction).mockResolvedValue({ error: "", redirectTo: "/inventory" })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText("Correo electrónico")
    const passwordInput = screen.getByLabelText("Contraseña")

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar Sesión" }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/inventory")
    })
  })

  it("does not show error when no error", () => {
    render(<LoginForm />)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
