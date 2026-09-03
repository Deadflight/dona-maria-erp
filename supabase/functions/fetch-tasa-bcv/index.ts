import { createClient } from "npm:@supabase/supabase-js@2"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import * as XLSX from "npm:xlsx@^0.18.5"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const BCV_REFERENCE_PAGE_URL =
  "https://www.bcv.org.ve/estadisticas/tipo-cambio-de-referencia-smc"
const DOLAR_API_OFFICIAL_URL = "https://ve.dolarapi.com/v1/dolares/oficial"
const MAX_FETCH_ATTEMPTS = 3
const RETRY_DELAY_MS = 5_000

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

function normalizeCellValue(cell: unknown): string {
  if (typeof cell === "string") return cell.trim().replace(/\s+/g, " ")
  if (typeof cell === "number") return String(cell)
  return ""
}

function extractUsdReferenceRateFromRows(rows: unknown[][]): number {
  const normalizedRows = rows.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => normalizeCellValue(cell)),
  )

  for (const row of normalizedRows) {
    const lower = row.map((cell) => cell.toLowerCase())
    const usdIndex = lower.findIndex((cell) => cell === "usd")

    if (usdIndex < 0) continue

    const numericCandidates: number[] = []

    for (let i = usdIndex + 1; i < row.length; i += 1) {
      const raw = row[i] ?? ""
      const compact = raw.replace(/\s+/g, "").replace(/\u00a0/g, "")
      if (!compact) continue

      const normalized = compact.includes(",") && !compact.includes(".")
        ? compact.replace(",", ".")
        : compact

      const value = Number.parseFloat(normalized)
      if (Number.isFinite(value) && value > 0) {
        numericCandidates.push(value)
      }
    }

    const preferred = numericCandidates.find((value) => value > 1)
    if (typeof preferred === "number") {
      return preferred
    }
  }

  throw new Error("No se encontró la tasa USD del BCV en la hoja")
}

function parseDolarApiOfficialRate(payload: unknown): number {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respuesta de DolarAPI no válida")
  }

  const data = payload as { fuente?: unknown; promedio?: unknown }
  if (data.fuente !== "oficial") {
    throw new Error("DolarAPI no devolvió una tasa oficial")
  }

  const rate = typeof data.promedio === "number" ? data.promedio : Number(data.promedio)
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("DolarAPI no devolvió una tasa válida")
  }

  return rate
}

async function fetchLatestBcvXlsUrl(): Promise<string> {
  const response = await fetch(BCV_REFERENCE_PAGE_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "dona-maria-erp/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`BCV page error: ${response.status}`)
  }

  const html = await response.text()
  const matches = Array.from(
    new Set(html.match(/https:\/\/www\.bcv\.org\.ve\/sites\/default\/files\/[^"'\s]+\.xls/g) ?? []),
  )

  if (matches.length === 0) {
    throw new Error("No se encontró un archivo XLS del BCV")
  }

  return matches[0]
}

async function fetchBcvRate(): Promise<{ rate: number; attempts: number }> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const xlsUrl = await fetchLatestBcvXlsUrl()

      const xlsResponse = await fetch(xlsUrl, {
        headers: {
          Accept: "application/vnd.ms-excel",
          "User-Agent": "dona-maria-erp/1.0",
        },
      })

      if (!xlsResponse.ok) {
        throw new Error(`BCV spreadsheet error: ${xlsResponse.status}`)
      }

      const buffer = new Uint8Array(await xlsResponse.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: "array" })

      const sheetNames = workbook.SheetNames ?? []
      if (sheetNames.length === 0) {
        throw new Error("La hoja del BCV no contiene datos")
      }

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], {
        header: 1,
        raw: false,
        blankrows: false,
      }) as unknown[][]

      return { rate: extractUsdReferenceRateFromRows(rows), attempts: attempt }
    } catch (error) {
      lastError = error
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await delay(RETRY_DELAY_MS)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No se pudo obtener la tasa del BCV")
}

async function fetchDolarApiRate(): Promise<number> {
  const response = await fetch(DOLAR_API_OFFICIAL_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "dona-maria-erp/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`DolarAPI error: ${response.status}`)
  }

  return parseDolarApiOfficialRate(await response.json())
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  )
  const { data: syncRun } = await supabase
    .from("bcv_sync_runs")
    .insert({ status: "running", attempts: 0 })
    .select("id")
    .single()

  try {
    let tasa: number
    let attempts: number
    let fuente: "api_bcv" | "api_dolarapi"

    try {
      const bcvResult = await fetchBcvRate()
      tasa = bcvResult.rate
      attempts = bcvResult.attempts
      fuente = "api_bcv"
    } catch (bcvError) {
      tasa = await fetchDolarApiRate()
      attempts = MAX_FETCH_ATTEMPTS
      fuente = "api_dolarapi"
      console.warn("BCV unavailable; using DolarAPI official fallback", bcvError)
    }

    if (!Number.isFinite(tasa) || tasa <= 0) {
      throw new Error("La tasa obtenida no es válida")
    }

    const today = new Date().toISOString().slice(0, 10)

    const { error: activeError } = await supabase
      .from("tasas_cambio")
      .update({ activa: false })
      .eq("activa", true)

    if (activeError) {
      throw new Error(activeError.message)
    }

    const { error } = await supabase.from("tasas_cambio").insert({
      moneda_origen: "USD",
      moneda_destino: "VES",
      tasa,
      fuente,
      fecha: today,
      activa: true,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (syncRun?.id) {
      await supabase
        .from("bcv_sync_runs")
        .update({ status: "success", attempts, finished_at: new Date().toISOString() })
        .eq("id", syncRun.id)
    }

    return new Response(
      JSON.stringify({ success: true, tasa, fuente, fecha: today }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"

    if (syncRun?.id) {
      await supabase
        .from("bcv_sync_runs")
        .update({
          status: "failed",
          attempts: MAX_FETCH_ATTEMPTS,
          finished_at: new Date().toISOString(),
          error_message: message,
        })
        .eq("id", syncRun.id)
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    )
  }
})
