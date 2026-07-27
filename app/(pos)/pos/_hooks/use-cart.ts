"use client"

import { useReducer, useCallback, useMemo } from "react"
import { roundToDecimals } from "@/lib/numeric"
import { UNIDAD_CONFIG, type TipoUnidad } from "@/lib/constants/unidad-config"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartProduct = {
  id: string
  nombre: string
  sku: string
  precio_venta: number
  stock_actual: number
  tipo_unidad: TipoUnidad
  unidad_base: string
  factor_conversion: number
  categoria: string
}

export type CartItem = {
  product: CartProduct
  cantidad: number
  precio_venta: number
  subtotal: number
}

type CartState = {
  items: CartItem[]
  paymentMethod: "efectivo" | "transferencia" | "credito" | null
  clienteId: string | null
  clienteNombre: string | null
  amountReceived: number | null
}

type CartAction =
  | { type: "ADD_ITEM"; product: CartProduct }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; cantidad: number }
  | { type: "SET_PAYMENT_METHOD"; method: CartState["paymentMethod"] }
  | { type: "SET_CLIENT"; id: string | null; nombre: string | null }
  | { type: "SET_AMOUNT_RECEIVED"; amount: number | null }
  | { type: "CLEAR_CART" }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function computeLineTotal(cantidad: number, precio_venta: number): number {
  return roundToDecimals(cantidad * precio_venta, 2)
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.product.id === action.product.id,
      )
      if (existing) {
        const step = UNIDAD_CONFIG[action.product.tipo_unidad].step
        const newQty = roundToDecimals(existing.cantidad + step, UNIDAD_CONFIG[action.product.tipo_unidad].maxDecimals)
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, cantidad: newQty, subtotal: computeLineTotal(newQty, i.precio_venta) }
              : i,
          ),
        }
      }
      const step = UNIDAD_CONFIG[action.product.tipo_unidad].step
      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.product,
            cantidad: step,
            precio_venta: action.product.precio_venta,
            subtotal: computeLineTotal(step, action.product.precio_venta),
          },
        ],
      }
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.product.id !== action.productId),
      }
    case "UPDATE_QUANTITY": {
      if (action.cantidad <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.product.id !== action.productId),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId
            ? { ...i, cantidad: action.cantidad, subtotal: computeLineTotal(action.cantidad, i.precio_venta) }
            : i,
        ),
      }
    }
    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.method }
    case "SET_CLIENT":
      return { ...state, clienteId: action.id, clienteNombre: action.nombre }
    case "SET_AMOUNT_RECEIVED":
      return { ...state, amountReceived: action.amount }
    case "CLEAR_CART":
      return {
        items: [],
        paymentMethod: null,
        clienteId: null,
        clienteNombre: null,
        amountReceived: null,
      }
    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  paymentMethod: null,
  clienteId: null,
  clienteNombre: null,
  amountReceived: null,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const addItem = useCallback(
    (product: CartProduct) => dispatch({ type: "ADD_ITEM", product }),
    [],
  )
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: "REMOVE_ITEM", productId }),
    [],
  )
  const updateQuantity = useCallback(
    (productId: string, cantidad: number) =>
      dispatch({ type: "UPDATE_QUANTITY", productId, cantidad }),
    [],
  )
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), [])
  const setPaymentMethod = useCallback(
    (method: CartState["paymentMethod"]) =>
      dispatch({ type: "SET_PAYMENT_METHOD", method }),
    [],
  )
  const setClient = useCallback(
    (id: string | null, nombre: string | null) =>
      dispatch({ type: "SET_CLIENT", id, nombre }),
    [],
  )
  const setAmountReceived = useCallback(
    (amount: number | null) => dispatch({ type: "SET_AMOUNT_RECEIVED", amount }),
    [],
  )

  const totals = useMemo(() => {
    const subtotal = roundToDecimals(
      state.items.reduce((sum, i) => sum + i.subtotal, 0),
      2,
    )
    const impuesto = 0 // IVA deferred
    const total = roundToDecimals(subtotal + impuesto, 2)
    return { subtotal, impuesto, total }
  }, [state.items])

  const isEmpty = state.items.length === 0
  const isCreditoWithoutClient =
    state.paymentMethod === "credito" && !state.clienteId

  const change = useMemo(() => {
    if (state.paymentMethod !== "efectivo" || state.amountReceived === null) {
      return null
    }
    return roundToDecimals(state.amountReceived - totals.total, 2)
  }, [state.paymentMethod, state.amountReceived, totals.total])

  return {
    items: state.items,
    paymentMethod: state.paymentMethod,
    clienteId: state.clienteId,
    clienteNombre: state.clienteNombre,
    amountReceived: state.amountReceived,
    totals,
    isEmpty,
    isCreditoWithoutClient,
    change,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setPaymentMethod,
    setClient,
    setAmountReceived,
  }
}
