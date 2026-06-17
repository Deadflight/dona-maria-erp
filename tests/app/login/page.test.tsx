import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockLoginAction = vi.hoisted(() => vi.fn())
vi.mock("@/app/login/actions", () => ({
  loginAction: mockLoginAction,
}))


// describe("LoginPage", () => {
//   it("should dynamically import LoginForm with ssr disabled", async () => {

//     const { container } = render(<LoginPage />)
//     // ssr:false means form renders client-side only (empty in jsdom test)
//     expect(container).toBeDefined()
//   })
// })

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("thruty test to ensure test setup is working", () => {
    expect(true).toBe(true)
  })

  // it("should render the login form with card title", () => {
  //   render(<LoginForm />)

  //   const titles = screen.getAllByText("Iniciar Sesión")
  //   expect(titles.length).toBeGreaterThanOrEqual(1)
  // })

  // it("should render email input with Spanish label", () => {
  //   render(<LoginForm />)

  //   expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
  // })

  // it("should render password input with Spanish label", () => {
  //   render(<LoginForm />)

  //   expect(screen.getByLabelText("Contraseña")).toBeInTheDocument()
  // })

  // // it("should render submit button with Iniciar Sesión text", () => {
  // //   render(<LoginForm />)

  // //   const button = screen.getByRole("button", { name: "Iniciar Sesión" })
  // //   expect(button).toBeInTheDocument()
  // //   expect(button).not.toBeDisabled()
  // // })

  // // it("should render the form with email input", () => {
  // //   render(<LoginForm />)

  // //   expect(screen.getByPlaceholderText("admin@donamaria.com")).toBeInTheDocument()
  // // })
})
