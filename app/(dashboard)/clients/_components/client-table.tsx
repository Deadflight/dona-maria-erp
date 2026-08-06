"use client"

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Eye, EyeOff, UsersRound, XCircle } from "lucide-react"
import { toast } from "sonner"
import type { Database } from "@/types/database"
import { toggleClientActive, type ClientFormState } from "@/lib/supabase/actions/clientes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClientFormDialog } from "./client-form-dialog"

type ClientRow = Database["public"]["Tables"]["clientes"]["Row"]
type Session = { role: string } | null
type PageData = { rows: ClientRow[]; total: number; page: number; pageSize: number }
type Props = { initialData: PageData | null; error: string | null; searchParams: Record<string, string | undefined>; session: Session }
const money = (value: number | null) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(value ?? 0)

export function ClientTable({ initialData, error, searchParams, session }: Props) {
  const router = useRouter()
  const isAdmin = session?.role === "admin"
  const search = searchParams.search ?? ""
  const includeInactive = searchParams.includeInactive === "true"
  const page = initialData?.page ?? 1
  const pageSize = initialData?.pageSize ?? 10
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [editingClient, setEditingClient] = useState<ClientRow | undefined>()
  const [confirmClient, setConfirmClient] = useState<ClientRow | null>(null)
  const [toggleState, toggleAction, togglePending] = useActionState<ClientFormState, FormData>(toggleClientActive, {})

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])
  useEffect(() => {
    if (toggleState.success) toast.success("Estado del cliente actualizado")
  }, [toggleState.success])

  const navigate = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const nextSearch = overrides.search ?? search
    const nextPage = overrides.page ?? String(page)
    const nextSize = overrides.pageSize ?? String(pageSize)
    const nextInactive = overrides.includeInactive ?? (includeInactive ? "true" : "")
    if (nextSearch) params.set("search", nextSearch)
    if (nextPage !== "1") params.set("page", nextPage)
    if (nextSize !== "10") params.set("pageSize", nextSize)
    if (nextInactive === "true") params.set("includeInactive", "true")
    router.push(params.size ? `/clients?${params}` : "/clients")
  }
  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { if (value !== search) navigate({ search: value, page: "1" }) }, 300)
  }
  const totalPages = Math.max(1, Math.ceil((initialData?.total ?? 0) / pageSize))
  const from = initialData?.total ? (page - 1) * pageSize + 1 : 0
  const to = initialData ? Math.min(page * pageSize, initialData.total) : 0

  return <div className="space-y-4">
    {!isAdmin && <Alert><Eye className="size-4" /><AlertTitle>Modo solo lectura</AlertTitle><AlertDescription>Solo los administradores pueden crear, editar o cambiar el estado de clientes.</AlertDescription></Alert>}
    {error && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Error al cargar clientes</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input aria-label="Buscar clientes" placeholder="Buscar por nombre, RIF o teléfono..." defaultValue={search} onChange={onSearchChange} className="w-72" />
        <Button variant="outline" size="sm" onClick={() => navigate({ includeInactive: includeInactive ? "" : "true", page: "1" })}>{includeInactive ? <EyeOff /> : <Eye />}{includeInactive ? "Ocultar inactivos" : "Mostrar inactivos"}</Button>
      </div>
      {isAdmin && <Button onClick={() => { setEditingClient(undefined); setFormMode("create") }}>+ Nuevo Cliente</Button>}
    </div>
    {!error && initialData?.rows.length === 0 && <Card><CardContent className="flex flex-col items-center py-16 text-center"><UsersRound className="mb-4 size-14 text-muted-foreground/40" /><p className="text-lg font-medium">No se encontraron clientes</p><p className="mt-1 text-sm text-muted-foreground">{search || includeInactive ? "Intenta ajustar los filtros de búsqueda." : "Aún no hay clientes registrados."}</p>{isAdmin && !search && <Button className="mt-6" onClick={() => setFormMode("create")}>+ Crear primer cliente</Button>}</CardContent></Card>}
    {!error && initialData && initialData.rows.length > 0 && <Card><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>RIF/Cédula</TableHead><TableHead>Teléfono</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Límite de crédito</TableHead><TableHead className="text-right">Saldo actual</TableHead><TableHead>Estado</TableHead>{isAdmin && <TableHead>Acciones</TableHead>}</TableRow></TableHeader><TableBody>{initialData.rows.map((client) => <TableRow key={client.id}><TableCell className="font-medium">{client.nombre}</TableCell><TableCell>{client.rif_cedula ?? "-"}</TableCell><TableCell>{client.telefono ?? "-"}</TableCell><TableCell className="capitalize">{client.tipo}</TableCell><TableCell className="text-right tabular-nums">{money(client.limite_credito)}</TableCell><TableCell className="text-right tabular-nums">{money(client.saldo_actual)}</TableCell><TableCell>{client.activo !== false ? <Badge><CheckCircle2 />Activo</Badge> : <Badge variant="secondary"><XCircle />Inactivo</Badge>}</TableCell>{isAdmin && <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => { setEditingClient(client); setFormMode("edit") }}>Editar</Button><Button variant="ghost" size="sm" onClick={() => setConfirmClient(client)}>{client.activo !== false ? "Desactivar" : "Activar"}</Button></div></TableCell>}</TableRow>)}</TableBody></Table></div></Card>}
    {initialData && initialData.rows.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><p>Mostrando {from}-{to} de {initialData.total} clientes</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) })}>Anterior</Button><span className="flex items-center px-2">Página {page} de {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => navigate({ page: String(page + 1) })}>Siguiente</Button></div></div>}
    <Dialog open={Boolean(confirmClient)} onOpenChange={(open) => { if (!open && !togglePending) setConfirmClient(null) }}><DialogContent><DialogHeader><DialogTitle>Confirmar cambio de estado</DialogTitle><DialogDescription>Esta acción no elimina el cliente ni su historial.</DialogDescription></DialogHeader><p className="text-sm">¿Deseas {confirmClient?.activo !== false ? "desactivar" : "activar"} a <strong>{confirmClient?.nombre}</strong>?</p>{toggleState.message && <p className="text-sm text-destructive" role="alert">{toggleState.message}</p>}<form action={toggleAction} className="flex justify-end gap-2"><input type="hidden" name="id" value={confirmClient?.id ?? ""} /><input type="hidden" name="activo" value={String(confirmClient?.activo === false)} /><Button type="button" variant="outline" disabled={togglePending} onClick={() => setConfirmClient(null)}>Cancelar</Button><Button type="submit" disabled={togglePending} variant={confirmClient?.activo !== false ? "destructive" : "default"}>{togglePending ? "Guardando..." : confirmClient?.activo !== false ? "Sí, desactivar" : "Sí, activar"}</Button></form></DialogContent></Dialog>
    {formMode && <ClientFormDialog mode={formMode} client={editingClient} onClose={() => { setFormMode(null); setEditingClient(undefined) }} />}
  </div>
}
