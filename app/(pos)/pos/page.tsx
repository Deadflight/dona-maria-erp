"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoppingCart, LogOut } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ProductSearch } from "./_components/product-search"
import { Cart } from "./_components/cart"
import { PaymentPanel } from "./_components/payment-panel"
import { ClientSelector } from "./_components/client-selector"
import { ReceiptPreview } from "./_components/receipt-preview"
import { useCart, type CartProduct } from "./_hooks/use-cart"
import { createSale } from "@/lib/supabase/actions/ventas"

// ---------------------------------------------------------------------------
// Receipt state
// ---------------------------------------------------------------------------

type ReceiptState = {
  invoiceNumber: string
  items: { nombre: string; cantidad: number; precio_venta: number; subtotal: number }[]
  subtotal: number
  impuesto: number
  total: number
  paymentMethod: string
  sellerName: string
  clientName: string | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function POSPage() {
  const cart = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [sellerName, setSellerName] = useState<string>("Vendedor")

  // Get seller name from session (runs once)
  useEffect(() => {
    async function fetchSession() {
      try {
        const { getSession } = await import("@/actions/auth")
        const { data } = await getSession()
        if (data?.fullName) setSellerName(data.fullName)
        else if (data?.email) setSellerName(data.email)
      } catch {
        // fallback already set
      }
    }
    fetchSession()
  }, [])

  // F2 = focus cart area (scroll to cart)
  // F3 = trigger confirm
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault()
        const cartEl = document.getElementById("pos-cart")
        cartEl?.scrollIntoView({ behavior: "smooth" })
      }
      if (e.key === "F3") {
        e.preventDefault()
        if (!cart.isEmpty && cart.paymentMethod && !cart.isCreditoWithoutClient) {
          handleConfirmSale()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  const handleAddProduct = useCallback(
    (product: CartProduct) => {
      cart.addItem(product)
    },
    [cart.addItem],
  )

  const handleConfirmSale = useCallback(async () => {
    if (cart.isEmpty || !cart.paymentMethod || cart.isCreditoWithoutClient) return

    setIsSubmitting(true)
    try {
      const result = await createSale({
        cliente_id: cart.clienteId,
        metodo_pago: cart.paymentMethod,
        subtotal: cart.totals.subtotal,
        impuesto: cart.totals.impuesto,
        total: cart.totals.total,
        items: cart.items.map((i) => ({
          producto_id: i.product.id,
          cantidad: i.cantidad,
          precio_venta: i.precio_venta,
        })),
      })

      if (result.error) {
        alert(`Error: ${result.error}`)
        return
      }

      if (result.data) {
        // Show receipt
        setReceipt({
          invoiceNumber: result.data.numero_factura,
          items: cart.items.map((i) => ({
            nombre: i.product.nombre,
            cantidad: i.cantidad,
            precio_venta: i.precio_venta,
            subtotal: i.subtotal,
          })),
          subtotal: cart.totals.subtotal,
          impuesto: cart.totals.impuesto,
          total: cart.totals.total,
          paymentMethod: cart.paymentMethod,
          sellerName,
          clientName: cart.clienteNombre,
        })
        cart.clearCart()
      }
    } catch {
      alert("Error de conexión. Intente de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }, [cart, sellerName])

  const handleCloseReceipt = useCallback(() => {
    setReceipt(null)
  }, [])

  return (
    <>
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <ShoppingCart className="size-5 text-primary" />
          <h1 className="text-sm font-bold uppercase tracking-wide">
            Terminal de Ventas
          </h1>
          {cart.items.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {cart.items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{sellerName}</span>
          <Link href="/dashboard">
            <Button variant="ghost" size="icon-xs">
              <LogOut className="size-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content — 3 column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product search + Cart */}
        <div className="flex flex-1 flex-col border-r">
          {/* Search */}
          <div className="border-b p-4">
            <ProductSearch onSelect={handleAddProduct} />
          </div>

          {/* Cart */}
          <div id="pos-cart" className="flex flex-1 flex-col overflow-hidden">
            <Cart
              items={cart.items}
              totals={cart.totals}
              onUpdateQuantity={cart.updateQuantity}
              onRemoveItem={cart.removeItem}
              onClearCart={cart.clearCart}
            />
          </div>
        </div>

        {/* Right: Client + Payment */}
        <div className="flex w-80 flex-col border-l">
          {/* Client selector */}
          <div className="border-b p-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cliente
            </p>
            <ClientSelector
              selectedClientId={cart.clienteId}
              selectedClientName={cart.clienteNombre}
              onSelect={cart.setClient}
            />
          </div>

          {/* Payment panel */}
          <div className="flex-1 p-4">
            <PaymentPanel
              total={cart.totals.total}
              paymentMethod={cart.paymentMethod}
              clienteNombre={cart.clienteNombre}
              isCreditoWithoutClient={cart.isCreditoWithoutClient}
              isEmpty={cart.isEmpty}
              amountReceived={cart.amountReceived}
              change={cart.change}
              onSetPaymentMethod={cart.setPaymentMethod}
              onSetAmountReceived={cart.setAmountReceived}
              onConfirm={handleConfirmSale}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Receipt preview overlay */}
      {receipt && (
        <ReceiptPreview
          invoiceNumber={receipt.invoiceNumber}
          items={receipt.items}
          subtotal={receipt.subtotal}
          impuesto={receipt.impuesto}
          total={receipt.total}
          paymentMethod={receipt.paymentMethod}
          sellerName={receipt.sellerName}
          clientName={receipt.clientName}
          onClose={handleCloseReceipt}
        />
      )}
    </>
  )
}
