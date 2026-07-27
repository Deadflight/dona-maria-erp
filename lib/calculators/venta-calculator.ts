// ---------------------------------------------------------------------------
// Venta Calculator — Pure calculation functions for cart IVA + discounts
// ---------------------------------------------------------------------------

import { roundToDecimals } from "@/lib/numeric"

export type DescuentoTipo = "%" | "fixed"

const IVA_RATE = 0.16

// ---------------------------------------------------------------------------
// Line Total
// ---------------------------------------------------------------------------

/**
 * Computes line total after applying a discount.
 *
 * @param cantidad - Item quantity
 * @param precio - Unit price (pre-tax)
 * @param descuento - Discount value (default 0)
 * @param descuentoTipo - "%" applies as percentage, "fixed" subtracts flat amount
 * @returns The discounted line total, clamped to [0, lineTotal]
 */
export function calculateLineTotal(
  cantidad: number,
  precio: number,
  descuento: number = 0,
  descuentoTipo: DescuentoTipo = "%",
): number {
  const lineTotal = roundToDecimals(cantidad * precio, 2)

  if (descuento <= 0) return lineTotal

  let discountAmount: number
  if (descuentoTipo === "%") {
    discountAmount = roundToDecimals(lineTotal * (Math.min(descuento, 100) / 100), 2)
  } else {
    discountAmount = roundToDecimals(Math.min(descuento, lineTotal), 2)
  }

  return roundToDecimals(Math.max(0, lineTotal - discountAmount), 2)
}

// ---------------------------------------------------------------------------
// IVA
// ---------------------------------------------------------------------------

/**
 * Applies IVA (VAT) rate to a subtotal.
 *
 * @param subtotal - Subtotal after discount
 * @param rate - Tax rate (default 0.16 = 16%)
 * @returns The IVA amount
 */
export function calculateIVA(subtotal: number, rate: number = IVA_RATE): number {
  return roundToDecimals(subtotal * rate, 2)
}

// ---------------------------------------------------------------------------
// Cart Totals Aggregation
// ---------------------------------------------------------------------------

type CartLineItem = {
  cantidad: number
  precio_venta: number
  descuento?: number
  descuento_tipo?: DescuentoTipo
}

type CartTotals = {
  subtotal: number
  descuentoTotal: number
  impuesto: number
  total: number
}

/**
 * Aggregates cart totals from line items.
 *
 * - subtotal: sum of all discounted line totals (before IVA)
 * - descuentoTotal: sum of all discount amounts
 * - impuesto: 16% IVA on the subtotal
 * - total: subtotal + impuesto
 */
export function calculateCartTotals(items: CartLineItem[]): CartTotals {
  if (items.length === 0) {
    return { subtotal: 0, descuentoTotal: 0, impuesto: 0, total: 0 }
  }

  let subtotal = 0
  let descuentoTotal = 0

  for (const item of items) {
    const grossLine = roundToDecimals(item.cantidad * item.precio_venta, 2)
    const netLine = calculateLineTotal(
      item.cantidad,
      item.precio_venta,
      item.descuento ?? 0,
      item.descuento_tipo ?? "%",
    )
    subtotal = roundToDecimals(subtotal + netLine, 2)
    descuentoTotal = roundToDecimals(descuentoTotal + (grossLine - netLine), 2)
  }

  const impuesto = calculateIVA(subtotal)
  const total = roundToDecimals(subtotal + impuesto, 2)

  return { subtotal, descuentoTotal, impuesto, total }
}
