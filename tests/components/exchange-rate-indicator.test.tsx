import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ExchangeRateIndicator } from "@/components/exchange-rate-indicator"

describe("ExchangeRateIndicator", () => {
  it("shows the current rate and source", () => {
    render(
      <ExchangeRateIndicator
        rate={{
          tasa: 36.5,
          fuente: "api_bcv",
          createdAt: "2026-09-03T12:00:00.000Z",
          status: "current",
        }}
      />,
    )

    expect(screen.getByText("Tasa USD/VES")).toBeInTheDocument()
    expect(screen.getByText(/36,50/)).toBeInTheDocument()
    expect(screen.getByText(/API BCV/)).toBeInTheDocument()
    expect(screen.getByText("Vigente")).toBeInTheDocument()
  })

  it("clearly marks a stale rate", () => {
    render(
      <ExchangeRateIndicator
        rate={{
          tasa: 36.5,
          fuente: "manual",
          createdAt: "2026-09-01T12:00:00.000Z",
          status: "stale",
        }}
      />,
    )

    expect(screen.getByText("Tasa vencida")).toBeInTheDocument()
    expect(screen.getByText(/Manual/)).toBeInTheDocument()
  })

  it.each([
    ["api_bcv", "API BCV"],
    ["api_dolarapi", "API DolarAPI"],
    ["manual", "Manual"],
    ["fallida", "Fallida"],
  ])("labels the %s source separately", (source, label) => {
    render(
      <ExchangeRateIndicator
        rate={{
          tasa: source === "fallida" ? null : 36.5,
          fuente: source,
          createdAt: "2026-09-03T12:00:00.000Z",
          status: source === "fallida" ? "unavailable" : "current",
        }}
      />,
    )

    expect(screen.getByText("Tasa USD/VES")).toBeInTheDocument()
    expect(screen.getByText(`Fuente: ${label}`)).toBeInTheDocument()
  })

  it("does not present an unavailable rate as valid", () => {
    render(
      <ExchangeRateIndicator
        rate={{ tasa: null, fuente: null, createdAt: null, status: "unavailable" }}
      />,
    )

    expect(screen.getByText("Tasa no disponible")).toBeInTheDocument()
    expect(screen.getByText("Sin tasa válida")).toBeInTheDocument()
  })
})
