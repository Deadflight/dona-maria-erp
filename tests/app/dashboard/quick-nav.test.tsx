import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { QuickNav } from "@/app/(dashboard)/dashboard/_components/quick-nav"

describe("QuickNav", () => {
  it("renders 3 navigation cards with titles", () => {
    render(<QuickNav />)

    expect(screen.getByText("Recepción de Mercancía")).toBeInTheDocument()
    expect(screen.getByText("Productos")).toBeInTheDocument()
    expect(screen.getByText("Alertas de Stock")).toBeInTheDocument()
  })

  it("each card has correct href", () => {
    render(<QuickNav />)

    const links = screen.getAllByRole("link")
    expect(links.length).toBe(3)

    // Link order matches card order in navCards array
    expect(links[0]).toHaveAttribute("href", "/receipts")
    expect(links[1]).toHaveAttribute("href", "/products")
    expect(links[2]).toHaveAttribute("href", "/inventory")
  })

  it("each card has a description", () => {
    render(<QuickNav />)

    expect(
      screen.getByText("Registrar entrada de productos al inventario"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Gestionar catálogo de productos"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Productos con stock por debajo del mínimo"),
    ).toBeInTheDocument()
  })

  it("each card renders an icon", () => {
    const { container } = render(<QuickNav />)

    // Each of the 3 cards has an SVG icon
    const icons = container.querySelectorAll("svg.size-5")
    expect(icons.length).toBe(3)
  })

  it("renders exactly 3 links", () => {
    render(<QuickNav />)

    const links = screen.getAllByRole("link")
    expect(links.length).toBe(3)
  })
})
