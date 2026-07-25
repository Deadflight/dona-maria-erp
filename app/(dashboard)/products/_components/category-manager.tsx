"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, Trash2 } from "lucide-react"

import {
  listCategorias,
  createCategoriaAction,
  deleteCategoriaAction,
} from "@/lib/supabase/actions/categorias"
import type { CategoriaFormState } from "@/lib/supabase/actions/categorias"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoriaRow = {
  id: string
  nombre: string
  activo: boolean
  created_at: string
}

type CategoryManagerProps = {
  open: boolean
  onClose: () => void
  /** Current user role — controls delete button visibility */
  role?: string
}

// ---------------------------------------------------------------------------
// Category Manager Dialog
// ---------------------------------------------------------------------------

export function CategoryManager({
  open,
  onClose,
  role,
}: CategoryManagerProps) {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const isAdmin = role === "admin"

  // --- Create state ---
  const [createState, createAction, createPending] = useActionState<
    CategoriaFormState,
    FormData
  >(createCategoriaAction, {})

  // --- Delete state ---
  const [deleteState, deleteAction, deletePending] = useActionState<
    CategoriaFormState,
    FormData
  >(deleteCategoriaAction, {})

  // --- Fetch categories (stable reference) ---
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    const result = await listCategorias()
    if (result.error) {
      setFetchError(result.error)
    } else {
      setCategorias(result.data ?? [])
    }
    setLoading(false)
  }, [])

  // Fetch on open
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      fetchCategories()
    }
    prevOpen.current = open
  }, [open, fetchCategories])

  // Refresh after create success
  const prevCreateSuccess = useRef(false)
  useEffect(() => {
    if (createState.success && !prevCreateSuccess.current) {
      fetchCategories()
    }
    prevCreateSuccess.current = createState.success ?? false
  }, [createState.success, fetchCategories])

  // Refresh after delete success
  const prevDeleteSuccess = useRef(false)
  useEffect(() => {
    if (deleteState.success && !prevDeleteSuccess.current) {
      fetchCategories()
    }
    prevDeleteSuccess.current = deleteState.success ?? false
  }, [deleteState.success, fetchCategories])

  // --- Handle dialog close ---
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Categorías</DialogTitle>
          <DialogDescription>
            Administra las categorías disponibles para los productos.
          </DialogDescription>
        </DialogHeader>

        {/* --- Create form --- */}
        {isAdmin && (
          <form action={createAction} className="flex gap-2">
            <Input
              name="nombre"
              placeholder="Nueva categoría"
              className="flex-1"
            />
            <Button type="submit" disabled={createPending}>
              {createPending ? "Agregando..." : "Agregar"}
            </Button>
          </form>
        )}

        {/* --- Create errors --- */}
        {createState.errors?.nombre && (
          <p className="text-xs text-destructive">
            {createState.errors.nombre.join(", ")}
          </p>
        )}

        {createState.message && !createState.success && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{createState.message}</span>
          </div>
        )}

        {/* --- Delete errors --- */}
        {deleteState.message && !deleteState.success && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{deleteState.message}</span>
          </div>
        )}

        {/* --- Category list --- */}
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {loading && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Cargando categorías...
            </p>
          )}

          {fetchError && (
            <p className="py-4 text-center text-sm text-destructive">
              Error: {fetchError}
            </p>
          )}

          {!loading && !fetchError && categorias.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay categorías registradas.
            </p>
          )}

          {!loading &&
            categorias.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
              >
                <span className="text-sm">{cat.nombre}</span>
                {isAdmin && (
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={cat.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      disabled={deletePending}
                      className="size-8 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Eliminar ${cat.nombre}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                )}
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}


