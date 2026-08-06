import { getSession } from "@/actions/auth"
import { listClientRecords } from "@/lib/supabase/actions/clientes"
import { ClientTable } from "./_components/client-table"

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string; pageSize?: string; includeInactive?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? "1", 10) || 1
  const pageSize = Number.parseInt(params.pageSize ?? "10", 10) || 10
  const [sessionResult, clientsResult] = await Promise.all([
    getSession(),
    listClientRecords({
      search: params.search,
      page,
      pageSize,
      includeInactive: params.includeInactive === "true",
    }),
  ])

  return <ClientTable initialData={clientsResult.data} error={clientsResult.error} searchParams={params} session={sessionResult.data} />
}
