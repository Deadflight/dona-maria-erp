import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PriceWithExchangeRate } from "@/components/price-with-exchange-rate"

describe("PriceWithExchangeRate", () => {
  it("shows USD and the VES equivalent with a current rate", () => {
    render(<PriceWithExchangeRate amount={100} exchangeRate={36.5} />)

    expect(screen.getByText("$100.00 USD")).toBeInTheDocument()
    expect(screen.getByText("Bs. 3.650,00 VES")).toBeInTheDocument()
  })

  it("does not invent a VES value without a usable rate", () => {
    render(<PriceWithExchangeRate amount={100} exchangeRate={null} />)

    expect(screen.getByText("$100.00 USD")).toBeInTheDocument()
    expect(screen.getByText("VES no disponible")).toBeInTheDocument()
  })
})
