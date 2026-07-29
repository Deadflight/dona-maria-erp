// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { getSaleById } from "@/lib/supabase/actions/ventas"
import { SalePrint } from "../../_components/sale-print"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>
}

// ---------------------------------------------------------------------------
// RSC: Sale Print Page
// ---------------------------------------------------------------------------

export default async function SalePrintPage({ params }: PageProps) {
  const { id } = await params
  const { data, error } = await getSaleById(id)

  // ---- Error / not found ------------------------------------------------
  if (!data || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="max-w-md rounded-lg border border-destructive/20 bg-destructive/5 p-8">
          <h1 className="mb-2 text-lg font-semibold text-destructive">
            Error al cargar la venta
          </h1>
          <p className="text-sm text-muted-foreground">
            {error ?? "Venta no encontrada. Verifique el número de factura e intente de nuevo."}
          </p>
        </div>
      </div>
    )
  }

  // ---- Success ----------------------------------------------------------
  return <SalePrint sale={data} />
}
