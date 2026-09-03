import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { getSession } from "@/actions/auth"
import {
  getCurrentExchangeRate,
  getExchangeRateHistory,
  setManualExchangeRate,
} from "@/lib/supabase/actions/tasas"
import { EXCHANGE_RATE_MAX_AGE_HOURS, isExchangeRateStale } from "@/lib/exchange-rate"
import { formatCurrency } from "@/lib/money"

async function updateManualRate(formData: FormData) {
  "use server"

  const value = Number(formData.get("tasa"))
  await setManualExchangeRate(value)
  revalidatePath("/rates")
  revalidatePath("/pos")
}

export default async function RatesPage() {
  const { data: session } = await getSession()
  if (session?.role !== "admin") {
    redirect("/inventory")
  }

  const [currentResult, historyResult] = await Promise.all([
    getCurrentExchangeRate(),
    getExchangeRateHistory(10),
  ])
  const current = currentResult.data
  const stale = !current || isExchangeRateStale(current.created_at)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tasa BCV</h1>
        <p className="text-sm text-muted-foreground">
          Estado de la tasa USD a VES y control de actualización manual
        </p>
      </div>

      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tasa vigente
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {current ? `${formatCurrency(current.tasa)} / USD` : "Sin tasa"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fuente: {current?.fuente ?? "Ninguna"} · Actualizada: {current?.created_at ?? "—"}
            </p>
          </div>
          <div className={stale ? "text-destructive" : "text-status-success"}>
            {stale ? <AlertTriangle className="size-6" /> : <CheckCircle2 className="size-6" />}
          </div>
        </div>
        <p className="mt-4 text-sm">
          {stale
            ? `La tasa está obsoleta. El límite permitido es ${EXCHANGE_RATE_MAX_AGE_HOURS} horas.`
            : "La tasa está vigente y puede utilizarse para registrar ventas."}
        </p>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Actualizar manualmente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Usa esta opción si BCV y el respaldo automático no están disponibles.
        </p>
        <form action={updateManualRate} className="mt-4 flex max-w-md items-end gap-3">
          <label className="flex-1 text-sm font-medium">
            USD a VES
            <input
              name="tasa"
              type="number"
              min="0.01"
              step="0.0001"
              required
              className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </label>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Guardar tasa
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Historial reciente</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4">Fecha</th>
                <th className="pb-2 pr-4">Tasa</th>
                <th className="pb-2">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {(historyResult.data ?? []).map((rate) => (
                <tr key={rate.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{rate.created_at ?? rate.fecha}</td>
                  <td className="py-2 pr-4 tabular-nums">{formatCurrency(rate.tasa)}</td>
                  <td className="py-2">{rate.fuente}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {historyResult.error && (
            <p className="mt-3 text-sm text-destructive">{historyResult.error}</p>
          )}
        </div>
      </section>
    </div>
  )
}
