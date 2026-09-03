"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useEffect } from "react"

import type { SaleDetail } from "@/lib/supabase/actions/ventas"
import { formatBs } from "./sale-print-utils"
import { formatUsd } from "@/lib/money"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  credito: "Crédito",
  pago_movil: "Pago Móvil",
  divisa: "Divisa",
  mixto: "Mixto",
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalePrintProps {
  sale: SaleDetail
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateStr))
}

function paymentLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}

const rateSourceLabels: Record<string, string> = {
  api_bcv: "API BCV",
  api_dolarapi: "API DolarAPI",
  manual: "Manual",
  fallida: "Fallida",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SalePrint({ sale }: SalePrintProps) {
  useEffect(() => {
    window.print()
  }, [])

  const totalDescuento = sale.detalles_venta.reduce(
    (sum, d) => sum + (d.descuento ?? 0),
    0,
  )

  return (
    <div className="sale-print">
      {/* ---- Store Header ---- */}
      <div className="sp-header">
        <h1>EL IMPERIO DOÑA MARÍA</h1>
        <p className="sp-subtitle">Ferretería</p>
      </div>

      {/* ---- Sale Info ---- */}
      <div className="sp-section">
        <table className="sp-info-table">
          <tbody>
            <tr>
              <td className="sp-label">Nº Factura:</td>
              <td className="sp-value">{sale.numero_factura}</td>
            </tr>
            <tr>
              <td className="sp-label">Fecha:</td>
              <td className="sp-value">{formatDate(sale.created_at)}</td>
            </tr>
            <tr>
              <td className="sp-label">Cliente:</td>
              <td className="sp-value">
                {sale.clientes?.nombre ?? "N/A"}
                {sale.clientes?.rif_cedula
                  ? ` | RIF: ${sale.clientes.rif_cedula}`
                  : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---- Items Table ---- */}
      <div className="sp-section">
        <h2 className="sp-section-title">Artículos</h2>
        <table className="sp-items-table">
          <thead>
            <tr>
              <th className="sp-th sp-th-name">Producto</th>
              <th className="sp-th sp-th-qty">Cant.</th>
              <th className="sp-th sp-th-amount">Precio Unit.</th>
              <th className="sp-th sp-th-amount">Dto.</th>
              <th className="sp-th sp-th-amount">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.detalles_venta.map((item) => (
              <tr key={item.id}>
                <td className="sp-td sp-td-name">{item.productos?.nombre ?? "—"}</td>
                <td className="sp-td sp-td-qty">{item.cantidad}</td>
                <td className="sp-td sp-td-amount">{formatUsd(item.precio_unitario)}</td>
                <td className="sp-td sp-td-amount">
                  {item.descuento && item.descuento > 0
                    ? formatUsd(item.descuento)
                    : "—"}
                </td>
                <td className="sp-td sp-td-amount sp-td-total">
                  {formatUsd(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Payments ---- */}
      {sale.pagos_venta.length > 0 && (
        <div className="sp-section">
          <h2 className="sp-section-title">Pagos</h2>
          <table className="sp-payments-table">
            <thead>
              <tr>
                <th className="sp-th sp-th-payment">Método</th>
                <th className="sp-th sp-th-amount">Monto</th>
                <th className="sp-th sp-th-ref">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {sale.pagos_venta.map((pago) => (
                <tr key={pago.id}>
                  <td className="sp-td">{paymentLabel(pago.metodo_pago)}</td>
                  <td className="sp-td sp-td-amount">{formatUsd(pago.monto)}</td>
                  <td className="sp-td sp-td-ref">
                    {pago.referencia ?? pago.banco ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Totals ---- */}
      <div className="sp-section">
        <table className="sp-totals-table">
          <tbody>
            <tr>
              <td className="sp-total-label">Subtotal USD:</td>
              <td className="sp-total-amount">{formatUsd(sale.subtotal)}</td>
            </tr>
            {totalDescuento > 0 && (
              <tr>
                <td className="sp-total-label">Descuento:</td>
                <td className="sp-total-amount">{formatUsd(-totalDescuento)}</td>
              </tr>
            )}
            <tr>
              <td className="sp-total-label">IVA (16%) USD:</td>
              <td className="sp-total-amount">{formatUsd(sale.impuesto)}</td>
            </tr>
            <tr className="sp-total-row">
              <td className="sp-total-label sp-total-grand">TOTAL USD:</td>
              <td className="sp-total-amount sp-total-grand">{formatUsd(sale.total)}</td>
            </tr>
            <tr>
              <td className="sp-total-label">Total VES:</td>
              <td className="sp-total-amount">
                {sale.total_ves !== null ? formatBs(sale.total_ves) : "Conversión VES no disponible"}
              </td>
            </tr>
            <tr>
              <td className="sp-total-label">Tasa aplicada:</td>
              <td className="sp-total-amount">
                {sale.tasa_cambio_usd_a_ves !== null
                  ? `${formatBs(sale.tasa_cambio_usd_a_ves)} / USD`
                  : "Tasa no disponible"}
              </td>
            </tr>
            <tr>
              <td className="sp-total-label">Fuente de tasa:</td>
              <td className="sp-total-amount">
                {sale.fuente_tasa ? rateSourceLabels[sale.fuente_tasa] ?? sale.fuente_tasa : "No registrada"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---- Footer ---- */}
      <div className="sp-footer">
        <p>¡Gracias por su compra!</p>
      </div>

      {/* ---- Print Styles ---- */}
      <style>{`
        .sale-print {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          color: #000;
          background: #fff;
          padding: 0;
          max-width: 210mm;
          margin: 0 auto;
        }

        .sp-header {
          text-align: center;
          margin-bottom: 24pt;
          padding-bottom: 12pt;
          border-bottom: 2px solid #000;
        }

        .sp-header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0 0 4pt;
        }

        .sp-subtitle {
          font-size: 11pt;
          margin: 0;
        }

        .sp-section {
          margin-bottom: 16pt;
        }

        .sp-section-title {
          font-size: 11pt;
          font-weight: bold;
          margin: 0 0 8pt;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
        }

        .sp-info-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sp-info-table td {
          padding: 2pt 4pt;
          font-size: 11pt;
        }

        .sp-label {
          font-weight: 600;
          width: 120pt;
          vertical-align: top;
        }

        .sp-value {
          vertical-align: top;
        }

        /* ---- Items Table ---- */
        .sp-items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sp-items-table th,
        .sp-items-table td {
          border: 1px solid #000;
          padding: 6pt 8pt;
          font-size: 10pt;
        }

        .sp-th {
          font-weight: bold;
          text-align: left;
          background: #f0f0f0;
        }

        .sp-th-name {
          text-align: left;
          width: auto;
        }

        .sp-th-qty {
          text-align: center;
          width: 50pt;
        }

        .sp-th-amount {
          text-align: right;
          width: 90pt;
        }

        .sp-th-ref {
          text-align: left;
          width: auto;
        }

        .sp-td-name {
          text-align: left;
        }

        .sp-td-qty {
          text-align: center;
        }

        .sp-td-amount {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .sp-td-ref {
          text-align: left;
        }

        .sp-td-total {
          font-weight: 600;
        }

        /* ---- Payments Table ---- */
        .sp-payments-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sp-payments-table th,
        .sp-payments-table td {
          border: 1px solid #000;
          padding: 6pt 8pt;
          font-size: 10pt;
        }

        .sp-th-payment {
          text-align: left;
          width: auto;
        }

        /* ---- Totals Table ---- */
        .sp-totals-table {
          width: 100%;
          max-width: 320pt;
          margin-left: auto;
          border-collapse: collapse;
        }

        .sp-totals-table td {
          padding: 4pt 8pt;
          font-size: 11pt;
        }

        .sp-total-label {
          font-weight: 600;
          text-align: right;
          width: 120pt;
        }

        .sp-total-amount {
          text-align: right;
          font-variant-numeric: tabular-nums;
          width: 120pt;
        }

        .sp-total-row td {
          border-top: 2px solid #000;
          padding-top: 6pt;
        }

        .sp-total-grand {
          font-size: 13pt;
          font-weight: bold;
        }

        .sp-footer {
          text-align: center;
          margin-top: 24pt;
          padding-top: 12pt;
          border-top: 2px solid #000;
          font-size: 10pt;
        }

        /* ---- Print Overrides ---- */
        @page {
          size: A4;
          margin: 15mm;
        }

        @media print {
          html,
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }

          body * {
            visibility: hidden;
          }

          .sale-print,
          .sale-print * {
            visibility: visible;
          }

          .sale-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
          }

          .sp-header {
            border-bottom-color: #000;
          }

          .sp-items-table th,
          .sp-items-table td {
            border-color: #000;
          }

          .sp-payments-table th,
          .sp-payments-table td {
            border-color: #000;
          }

          .sp-total-row td {
            border-top-color: #000;
          }

          .sp-footer {
            border-top-color: #000;
          }

          .sp-th {
            background: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
