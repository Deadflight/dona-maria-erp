import { getSession } from "@/actions/auth"
import { listCreditos } from "@/lib/supabase/actions/creditos"
import { CreditsTable } from "./_components/credits-table"

export default async function CreditsPage() {
  // Clients page pattern: session + list are fetched in parallel and the
  // server passes both to the client table component.
  const [sessionResult, creditsResult] = await Promise.all([
    getSession(),
    listCreditos(),
  ])

  return (
    <CreditsTable
      data={creditsResult.data}
      error={creditsResult.error}
      session={sessionResult.data}
    />
  )
}
