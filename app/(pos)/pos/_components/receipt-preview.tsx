"use client"

import { Printer, X } from "lucide-react"

import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReceiptItem = {
  nombre: string
  cantidad: number
  precio_venta: number
  subtotal: number
  descuento: number
}

type ReceiptPreviewProps = {
  invoiceNumber: string
  items: ReceiptItem[]
  subtotal: number
  descuentoTotal: number
  impuesto: number
  total: number
  paymentMethod: string
  sellerName: string
  clientName?: string | null
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReceiptPreview({
  invoiceNumber,
  items,
  subtotal,
  descuentoTotal,
  impuesto,
  total,
  paymentMethod,
  sellerName,
  clientName,
  onClose,
}: ReceiptPreviewProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString("es-VE")
  const timeStr = now.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const paymentLabel =
    paymentMethod === "efectivo"
      ? "Efectivo"
      : paymentMethod === "transferencia"
        ? "Transferencia"
        : paymentMethod === "credito"
          ? "Crédito"
          : paymentMethod

  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Screen overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto bg-white shadow-2xl print:relative print:inset-auto print:z-auto print:shadow-none print:max-w-none print:max-h-none">
          {/* Close + Print buttons (hidden on print) */}
          <div className="no-print flex items-center justify-between border-b px-4 py-2 print:hidden">
            <span className="text-sm font-medium">Vista previa del recibo</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-1.5 size-3.5" />
                Imprimir
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Thermal receipt — 80mm width approximation */}
          <div className="receipt-print p-4 font-mono text-xs leading-tight text-black">
            {/* Header */}
            <div className="mb-3 text-center">
              <p className="text-sm font-bold">EL IMPERIO DOÑA MARÍA</p>
              <p>Ferretería</p>
              <p className="mt-1">--------------------------------</p>
            </div>

            {/* Invoice info */}
            <div className="mb-2 space-y-0.5">
              <p>Factura: {invoiceNumber}</p>
              <p>Fecha: {dateStr} {timeStr}</p>
              <p>Vendedor: {sellerName}</p>
              {clientName && <p>Cliente: {clientName}</p>}
            </div>

            <p className="my-1">--------------------------------</p>

            {/* Items */}
            <div className="mb-2">
              <p className="mb-1 font-bold">ARTÍCULOS</p>
              {items.map((item, i) => {
                const lineTotal = item.cantidad * item.precio_venta
                const hasDiscount = item.descuento > 0
                return (
                  <div key={i} className="mb-1.5">
                    <p className="font-medium">{item.nombre}</p>
                    <div className="flex justify-between pl-2">
                      <span>
                        {item.cantidad} x ${item.precio_venta.toFixed(2)}
                      </span>
                      <span className="font-medium">
                        {hasDiscount ? (
                          <>
                            <span className="line-through">${lineTotal.toFixed(2)}</span>
                            {" "}
                            ${item.subtotal.toFixed(2)}
                          </>
                        ) : (
                          <>${item.subtotal.toFixed(2)}</>
                        )}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="pl-2 text-xs">
                        Descuento: -${item.descuento.toFixed(2)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="my-1">--------------------------------</p>

            {/* Totals */}
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {descuentoTotal > 0 && (
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span>-${descuentoTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA (16%):</span>
                <span>${impuesto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="my-2">--------------------------------</div>

            <p className="text-center">Pago: {paymentLabel}</p>

            <div className="mt-4 text-center">
              <p>¡Gracias por su compra!</p>
              <p className="mt-2">================================</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .receipt-print,
          .receipt-print * {
            visibility: visible !important;
          }
          .receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            padding: 5mm;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </>
  )
}
