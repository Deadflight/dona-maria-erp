import { getSession } from "@/actions/auth"
import { listCreditos } from "@/lib/supabase/actions/creditos"
import { CreditsTable } from "./_components/credits-table"
import { getCurrentExchangeRateDisplay } from "@/lib/supabase/actions/tasas"

export default async function CreditsPage() {
  // Clients page pattern: session + list are fetched in parallel and the
  // server passes both to the client table component.
  const [sessionResult, creditsResult, rateResult] = await Promise.all([
    getSession(),
    listCreditos(),
    getCurrentExchangeRateDisplay(),
  ])

  return (
    <CreditsTable
      data={creditsResult.data}
      error={creditsResult.error}
      session={sessionResult.data}
      exchangeRate={rateResult.data.status === "current" ? rateResult.data.tasa : null}
    />
  )
}
