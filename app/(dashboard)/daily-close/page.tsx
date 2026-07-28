"use client"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getSession } from "@/actions/auth"
import { getDailySummary } from "@/lib/supabase/actions/cierres"
import { DailySummary } from "./_components/daily-summary"
import { CashCounting } from "./_components/cash-counting"

export default function DailyClosePage() {
  const [session, setSession] = useState<{
    role: string
  } | null>(null)
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof getDailySummary>
  >["data"]>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data } = await getSession()
      if (!data) {
        redirect("/login")
      }
      if (data.role !== "admin") {
        redirect("/dashboard")
      }
      setSession(data)

      const today = new Date().toISOString().split("T")[0]
      const result = await getDailySummary(today)
      if (result.error) {
        setError(result.error)
      } else {
        setSummary(result.data)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Cierre Diario</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de ventas y conteo de efectivo del día
        </p>
      </div>

      {summary && <DailySummary summary={summary} />}

      <CashCounting
        systemTotal={summary?.systemTotal ?? 0}
        fecha={summary?.fecha ?? new Date().toISOString().split("T")[0]}
      />
    </div>
  )
}
