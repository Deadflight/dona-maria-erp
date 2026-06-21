import { redirect } from "next/navigation"
import { getSession } from "@/actions/auth"
import { listProveedores, generateReceiptNumber } from "@/lib/supabase/actions/compras"
import { ReceiptForm } from "../_components/receipt-form"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

// ---------------------------------------------------------------------------
// RSC: New Receipt Page
// ---------------------------------------------------------------------------

export default async function NewReceiptPage(_props: PageProps) {
  const { data: session } = await getSession()

  // -- Admin gate ------------------------------------------------------------
  if (!session || session.role !== "admin") {
    redirect("/receipts?readonly=true")
  }

  // -- Parallel fetch --------------------------------------------------------
  const [proveedoresResult, receiptNumberResult] = await Promise.all([
    listProveedores(),
    generateReceiptNumber(),
  ])

  const suppliers = proveedoresResult.data ?? []
  const numero_recepcion = receiptNumberResult.data ?? ""

  return (
    <ReceiptForm
      suppliers={suppliers}
      receiptNumber={numero_recepcion}
    />
  )
}
