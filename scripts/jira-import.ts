import { readFileSync } from "fs"
import { resolve } from "path"

// ============================================================
// Hardcoded Configuration
// ============================================================

const JIRA_URL = "https://dona-maria.atlassian.net"
const JIRA_PROJECT_KEY = "SEIDM"
const JIRA_EMAIL = "correamillancarlos@gmail.com"

const EPIC_ISSUETYPE_ID = "10041"
const TASK_ISSUETYPE_ID = "10043"

const START_DATE = new Date(2026, 4, 18) // Mon May 18, 2026

// ============================================================
// Data from ganttpro-especificacion.md
// ============================================================

interface Activity {
  num: number
  name: string
}

interface Phase {
  epicName: string
  epicSummary: string
  fromDay: number
  toDay: number
  activities: Activity[]
  milestone: string
}

const PHASES: Phase[] = [
  {
    epicName: "Fase I: Diagnóstico Operativo",
    epicSummary: "Fase I: Diagnóstico Operativo y Brechas de Control Financiero",
    fromDay: 1,
    toDay: 8,
    activities: [
      { num: 1, name: "Auditoría de procesos en mostrador (toma de tiempos)" },
      { num: 2, name: "Mapeo de canales de comunicación inter-turnos" },
      { num: 3, name: "Auditoría del flujo de conciliación financiera" },
      { num: 4, name: "Evaluación de pérdidas por desabastecimiento" },
      { num: 5, name: "Modelado de reglas de negocio especiales (fracciones, créditos)" },
      { num: 6, name: "Formalización del diagnóstico situacional" },
      { num: 7, name: "Definición de objetivos y delimitación del alcance MVP" },
      { num: 8, name: "Construcción de la matriz de factibilidad integral" },
    ],
    milestone: "◆ Diagnóstico institucional validado por tutores",
  },
  {
    epicName: "Fase II: Rediseño y Modelado",
    epicSummary: "Fase II: Rediseño de Procesos y Modelado Lógico",
    fromDay: 9,
    toDay: 16,
    activities: [
      { num: 9, name: "Rediseño del flujo de procesos en mostrador" },
      { num: 10, name: "Modelado de datos para productos fraccionados" },
      { num: 11, name: "Estructuración del modelo relacional financiero" },
      { num: 12, name: "Construcción de diagramas UML (Casos de Uso, DER)" },
      { num: 13, name: "Parametrización del entorno cloud (Supabase + PostgreSQL)" },
      { num: 14, name: "Inicialización de infraestructura de desarrollo (Next.js, GitHub)" },
      { num: 15, name: "Setup del sistema de diseño (Tailwind CSS + shadcn/ui)" },
      { num: 16, name: "Pruebas de integración y conectividad (Server Actions)" },
    ],
    milestone: "◆ Arquitectura lógica y entorno tecnológico inicializado",
  },
  {
    epicName: "Fase III: Control de Inventarios",
    epicSummary: "Fase III: Mitigación del Descontrol de Existencias",
    fromDay: 17,
    toDay: 24,
    activities: [
      { num: 17, name: "Construcción del panel de gestión administrativa de inventario" },
      { num: 18, name: "Desarrollo del sub-módulo de alertas de stock crítico" },
      { num: 19, name: "Implementación del algoritmo de actualización masiva de precios" },
      { num: 20, name: "Desarrollo de interfaz para recepción y registro de mercancía" },
      { num: 21, name: "Programación de restricciones y validaciones del lado del servidor" },
      { num: 22, name: "Implementación del procesamiento numérico fraccionado" },
      { num: 23, name: "Simulación de carga integral con datos históricos" },
      { num: 24, name: "Documentación técnica de la arquitectura de stock" },
    ],
    milestone: "◆ Módulo de control de inventarios operativo y validado",
  },
  {
    epicName: "Fase IV: Mostrador y Conciliación",
    epicSummary: "Fase IV: Optimización de Mostrador y Conciliación Financiera",
    fromDay: 25,
    toDay: 32,
    activities: [
      { num: 25, name: "Maquetado de la terminal de ventas de alta velocidad" },
      { num: 26, name: "Desarrollo del motor de búsqueda predictiva en mostrador" },
      { num: 27, name: "Automatización de venta express (perfil Consumidor Final)" },
      { num: 28, name: "Desarrollo del calculador síncrono de transacciones (carrito)" },
      { num: 29, name: "Programación del disparador transaccional (descuento de stock)" },
      { num: 30, name: "Desarrollo del módulo de cierre financiero automatizado" },
      { num: 31, name: "Integración del módulo de notas de venta en PDF" },
      { num: 32, name: "Pruebas de estrés y simulaciones de cierre entre turnos" },
    ],
    milestone: "◆ Motor transaccional y conciliación express estabilizados",
  },
  {
    epicName: "Fase V: Validación e Implantación",
    epicSummary: "Fase V: Validación en Campo, Implantación y Evaluación",
    fromDay: 33,
    toDay: 40,
    activities: [
      { num: 33, name: "Pruebas integrales de concurrencia (multidispositivo)" },
      { num: 34, name: "Construcción de la matriz de aceptación del sistema" },
      { num: 35, name: "Despliegue de la plataforma web en Vercel (producción)" },
      { num: 36, name: "Carga masiva inicial e indexación de artículos" },
      { num: 37, name: "Instalación física y configuración de navegadores en terminales" },
      { num: 38, name: "Plan de inducción técnica y capacitación al personal" },
      { num: 39, name: "Capacitación en auditoría financiera a la propietaria" },
      { num: 40, name: "Evaluación de impacto real y cierre del informe" },
    ],
    milestone: "◆ Sistema implantado formalmente y acta firmada",
  },
]

// ============================================================
// Helpers
// ============================================================

function loadToken(): string {
  const envPath = resolve(__dirname, "..", ".env.local")
  const content = readFileSync(envPath, "utf-8")

  const get = (key: string): string | undefined =>
    content
      .split("\n")
      .find((l) => l.startsWith(key + "="))
      ?.split("=")
      .slice(1)
      .join("=")

  const token = get("JIRA_TOKEN")?.trim()
  if (!token) {
    console.error("Missing JIRA_TOKEN in .env.local")
    process.exit(1)
  }
  return token
}

function computeBusinessDays(): Date[] {
  const dates: Date[] = []
  const current = new Date(START_DATE)
  while (dates.length < 40) {
    const dow = current.getDay()
    if (dow !== 0 && dow !== 6) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function fmtDateShort(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}/${m}`
}

// ============================================================
// Jira API Client
// ============================================================

class JiraClient {
  private auth: string

  constructor(email: string, token: string) {
    this.auth = Buffer.from(`${email}:${token}`).toString("base64")
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${JIRA_URL}${path}`
    const headers: Record<string, string> = {
      Authorization: `Basic ${this.auth}`,
      Accept: "application/json",
    }
    if (options.body) {
      headers["Content-Type"] = "application/json"
    }
    if (options.headers) {
      const requestHeaders = new Headers(options.headers)
      requestHeaders.forEach((value, key) => {
        headers[key] = value
      })
    }

    const res = await fetch(url, { ...options, headers })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Jira API ${res.status} ${res.statusText} for ${path}\n${text}`)
    }

    if (res.status === 204) return null as T
    return (await res.json()) as T
  }

  async createIssue(fields: Record<string, unknown>): Promise<{ id: string; key: string }> {
    const body = JSON.stringify({ fields })
    const result = await this.fetch<{ id: string; key: string }>("/rest/api/3/issue", {
      method: "POST",
      body,
    })
    return { id: result.id, key: result.key }
  }

  async linkIssues(outwardKey: string, inwardKey: string): Promise<void> {
    const body = JSON.stringify({
      type: { name: "Blocks" },
      inwardIssue: { key: inwardKey },
      outwardIssue: { key: outwardKey },
    })
    await this.fetch<null>("/rest/api/3/issueLink", {
      method: "POST",
      body,
    })
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  const token = loadToken()
  const jira = new JiraClient(JIRA_EMAIL, token)
  const dates = computeBusinessDays()

  const phasesWithCount = PHASES.length
  const tasksPerPhase = PHASES[0].activities.length
  const totalIssues = phasesWithCount * (1 + tasksPerPhase + 1) // epics + tasks + milestones
  const allKeys: string[] = []
  const epicKeys: string[] = []
  let createdCount = 0
  let failed = false

  console.log("🚀 Jira Import — Sistema El Imperio Doña María")
  console.log(`   Project: ${JIRA_PROJECT_KEY}`)
  console.log(`   Start:   ${fmtDate(dates[0])} (Mon 18/5)`)
  console.log(`   End:     ${fmtDate(dates[39])} (Fri 10/7)`)
  console.log(`   Total:   ${totalIssues} issues\n`)

  for (const phase of PHASES) {
    if (failed) break

    // -- Create Epic --
    console.log(`\n📁 ${phase.epicSummary}`)

    let epic: { id: string; key: string }
    try {
      epic = await jira.createIssue({
        project: { key: JIRA_PROJECT_KEY },
        issuetype: { id: EPIC_ISSUETYPE_ID },
        summary: phase.epicSummary,
        customfield_10015: fmtDate(dates[phase.fromDay - 1]),
        duedate: fmtDate(dates[phase.toDay - 1]),
      })
      createdCount++
      epicKeys.push(epic.key)
      console.log(`   ✅ Epic  ${epic.key}`)
    } catch (err) {
      console.error(`   ❌ Epic failed:`, (err as Error).message)
      failed = true
      break
    }

    // -- Create Tasks --
    for (const activity of phase.activities) {
      try {
        const issue = await jira.createIssue({
          project: { key: JIRA_PROJECT_KEY },
          issuetype: { id: TASK_ISSUETYPE_ID },
          summary: `${activity.num}. ${activity.name}`,
          parent: { key: epic.key },
          customfield_10015: fmtDate(dates[activity.num - 1]),
          duedate: fmtDate(dates[activity.num - 1]),
        })
        createdCount++
        allKeys.push(issue.key)
        console.log(`   ✅ ${issue.key}  ${activity.num}. ${activity.name}`)

        // Link previous → this (Fin-Inicio dependency)
        if (allKeys.length >= 2) {
          try {
            await jira.linkIssues(allKeys[allKeys.length - 2], issue.key)
          } catch {
            // non-blocking: link failure doesn't stop the import
          }
        }
      } catch (err) {
        console.error(`   ❌ Task ${activity.num} failed:`, (err as Error).message)
        failed = true
        break
      }
    }
    if (failed) break

    // -- Create Milestone --
    try {
      const milestoneDate = dates[phase.toDay - 1]
      const milestone = await jira.createIssue({
        project: { key: JIRA_PROJECT_KEY },
        issuetype: { id: TASK_ISSUETYPE_ID },
        summary: phase.milestone,
        parent: { key: epic.key },
        customfield_10015: fmtDate(milestoneDate),
        duedate: fmtDate(milestoneDate),
      })
      createdCount++
      allKeys.push(milestone.key)
      console.log(`   ✅ ${milestone.key}  ${phase.milestone}`)

      // Link last task → milestone
      if (allKeys.length >= 2) {
        try {
          await jira.linkIssues(allKeys[allKeys.length - 2], milestone.key)
        } catch {
          // non-blocking
        }
      }
    } catch (err) {
      console.error(`   ❌ Milestone failed:`, (err as Error).message)
      failed = true
      break
    }
  }

  console.log(`\n${"=".repeat(50)}`)
  if (failed) {
    console.log(`❌ IMPORT FAILED — ${createdCount} issues created before error`)
    process.exit(1)
  }

  const tasksAndMilestones = createdCount - PHASES.length
  console.log(`✅ Import complete! ${createdCount}/${totalIssues} issues created.`)
  console.log(`   ${PHASES.length} Epics, ${tasksAndMilestones} Tasks/Milestones, ${allKeys.length - 1} dependencies`)

  // Summary table
  console.log(`\n📋 Summary:`)
  console.log(`   ${"Phase".padEnd(38)} ${"Dates".padEnd(22)} Epic`)
  console.log(`   ${"─".repeat(38)} ${"─".repeat(22)} ${"─".repeat(10)}`)
  for (let i = 0; i < PHASES.length; i++) {
    const phase = PHASES[i]
    const from = fmtDateShort(dates[phase.fromDay - 1])
    const to = fmtDateShort(dates[phase.toDay - 1])
    const range = `${from} – ${to}`
    console.log(`   ${phase.epicSummary.padEnd(38)} ${range.padEnd(22)} ${epicKeys[i]}`)
  }
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
