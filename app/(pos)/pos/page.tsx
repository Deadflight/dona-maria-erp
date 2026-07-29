"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ShoppingCart, LogOut } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ProductSearch } from "./_components/product-search"
import { Cart } from "./_components/cart"
import { PaymentPanel } from "./_components/payment-panel"
import { ClientSelector } from "./_components/client-selector"
import { ReceiptPreview } from "./_components/receipt-preview"
import { useCart, type CartProduct } from "./_hooks/use-cart"
import { createSale } from "@/lib/supabase/actions/ventas"
import { UNIDAD_CONFIG } from "@/lib/constants/unidad-config"

// ---------------------------------------------------------------------------
// Receipt state
// ---------------------------------------------------------------------------

type ReceiptState = {
  saleId: string
  invoiceNumber: string
  items: { nombre: string; cantidad: number; precio_venta: number; subtotal: number; descuento: number }[]
  subtotal: number
  descuentoTotal: number
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
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const cartRef = useRef<HTMLDivElement>(null)

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

  // Clamp selected index when cart changes
  useEffect(() => {
    if (cart.items.length === 0) {
      setSelectedIndex(0)
    } else if (selectedIndex >= cart.items.length) {
      setSelectedIndex(cart.items.length - 1)
    }
  }, [cart.items.length, selectedIndex])

  const selectedItem = useMemo(
    () => (cart.items.length > 0 ? cart.items[Math.min(selectedIndex, cart.items.length - 1)] : null),
    [cart.items, selectedIndex],
  )

  // F2 = focus cart area (scroll to cart)
  // F3 = trigger confirm
  // Arrow Up/Down = navigate cart items
  // Arrow Left/Right = decrease/increase quantity by step
  // Number keys 1-9 = set quantity to N × step
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

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
        return
      }
      if (cart.items.length === 0) return

      // Arrow navigation
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(0, i - 1))
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(cart.items.length - 1, i + 1))
        return
      }

      if (!selectedItem) return
      const cfg = UNIDAD_CONFIG[selectedItem.product.tipo_unidad]

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        cart.updateQuantityByStep(selectedItem.product.id, -cfg.step)
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        cart.updateQuantityByStep(selectedItem.product.id, cfg.step)
        return
      }

      // Number keys 1-9 → set quantity to N × step
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 9) {
        e.preventDefault()
        const newQty = num * cfg.step
        cart.updateQuantity(selectedItem.product.id, newQty)
        return
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
          descuento: i.descuento,
        })),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data) {
        // Show receipt
        setReceipt({
          saleId: result.data.venta_id,
          invoiceNumber: result.data.numero_factura,
          items: cart.items.map((i) => ({
            nombre: i.product.nombre,
            cantidad: i.cantidad,
            precio_venta: i.precio_venta,
            subtotal: i.subtotal,
            descuento: i.descuento,
          })),
          subtotal: cart.totals.subtotal,
          descuentoTotal: cart.totals.descuentoTotal,
          impuesto: cart.totals.impuesto,
          total: cart.totals.total,
          paymentMethod: cart.paymentMethod,
          sellerName,
          clientName: cart.clienteNombre,
        })
        cart.clearCart()
      }
    } catch {
      toast.error("Error de conexión. Intente de nuevo.")
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
              onUpdateQuantityByStep={cart.updateQuantityByStep}
              onRemoveItem={cart.removeItem}
              onSetDiscount={cart.setDiscount}
              onClearCart={cart.clearCart}
              selectedIndex={selectedIndex}
              onSelectItem={setSelectedIndex}
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
              onSetAmountToExact={cart.setAmountToExact}
              onConfirm={handleConfirmSale}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Receipt preview overlay */}
      {receipt && (
        <ReceiptPreview
          saleId={receipt.saleId}
          invoiceNumber={receipt.invoiceNumber}
          items={receipt.items}
          subtotal={receipt.subtotal}
          descuentoTotal={receipt.descuentoTotal}
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
