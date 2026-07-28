"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { closeDay } from "@/lib/supabase/actions/cierres"
import { calculateDiscrepancy, isWithinTolerance } from "@/lib/financial/tolerance"
import { toast } from "sonner"

interface CashCountingProps {
  systemTotal: number
  fecha: string
}

export function CashCounting({ systemTotal, fecha }: CashCountingProps) {
  const [montoFisico, setMontoFisico] = useState<string>("")
  const [closing, setClosing] = useState(false)
  const [result, setResult] = useState<{
    discrepancia: number
    tolerancia_ok: boolean
  } | null>(null)

  const fisico = parseFloat(montoFisico) || 0
  const discrepancia = calculateDiscrepancy(systemTotal, fisico)
  const toleranciaOk = isWithinTolerance(discrepancia, systemTotal)
  const hasInput = montoFisico !== ""

  async function handleClose() {
    if (!hasInput) return

    setClosing(true)
    try {
      const res = await closeDay({ fecha, monto_fisico: fisico })
      if (res.error) {
        toast.error(res.error)
      } else {
        setResult({
          discrepancia: res.data!.discrepancia,
          tolerancia_ok: res.data!.tolerancia_ok,
        })
        toast.success("Cierre registrado correctamente")
      }
    } catch {
      toast.error("Error al registrar cierre")
    } finally {
      setClosing(false)
    }
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cierre Registrado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            El cierre del día <strong>{fecha}</strong> fue registrado exitosamente.
          </p>
          <div className="flex gap-2">
            <Badge variant={result.tolerancia_ok ? "default" : "destructive"}>
              {result.tolerancia_ok ? "Dentro de tolerancia" : "Fuera de tolerancia"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conteo de Efectivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sistema</p>
            <p className="text-lg font-semibold">
              ${systemTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Físico (conteo)</p>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={montoFisico}
              onChange={(e) => setMontoFisico(e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Discrepancia</p>
            {hasInput ? (
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">
                  {discrepancia >= 0 ? "+" : ""}${Math.abs(discrepancia).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  {discrepancia < 0 ? " (faltante)" : discrepancia > 0 ? " (sobrante)" : ""}
                </p>
                <Badge variant={toleranciaOk ? "default" : "destructive"}>
                  {toleranciaOk ? "OK" : "Alerta"}
                </Badge>
              </div>
            ) : (
              <p className="text-lg text-muted-foreground">—</p>
            )}
          </div>
        </div>

        <Button
          onClick={handleClose}
          disabled={!hasInput || closing}
          variant={toleranciaOk ? "default" : "destructive"}
        >
          {closing ? "Procesando..." : "Registrar Cierre"}
        </Button>
      </CardContent>
    </Card>
  )
}
