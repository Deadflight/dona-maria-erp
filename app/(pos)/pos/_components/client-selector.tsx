"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { User, X, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { listClients } from "@/lib/supabase/actions/ventas"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientResult = {
  id: string
  nombre: string
  rif_cedula: string | null
  limite_credito: number | null
  saldo_actual: number | null
}

type ClientSelectorProps = {
  selectedClientId: string | null
  selectedClientName: string | null
  onSelect: (
    id: string | null,
    nombre: string | null,
    limiteCredito: number | null,
    saldoActual: number | null,
  ) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClientSelector({
  selectedClientId,
  selectedClientName,
  onSelect,
  className,
}: ClientSelectorProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ClientResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const { data } = await listClients(value)
      setResults((data as ClientResult[]) ?? [])
      setShowResults(true)
      setLoading(false)
    }, 200)
  }, [])

  const handleSelect = useCallback(
    (client: ClientResult) => {
      onSelect(
        client.id,
        client.nombre,
        client.limite_credito,
        client.saldo_actual,
      )
      setQuery("")
      setResults([])
      setShowResults(false)
    },
    [onSelect],
  )

  const handleClear = useCallback(() => {
    onSelect(null, null, null, null)
    setQuery("")
    setResults([])
    setShowResults(false)
  }, [onSelect])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-client-selector]")) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Show selected client
  if (selectedClientId && selectedClientName) {
    return (
      <div className={cn("relative", className)} data-client-selector>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
          <User className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm font-medium">
            {selectedClientName}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            aria-label="Quitar cliente"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} data-client-selector>
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.trim() && setShowResults(true)}
          placeholder="Cliente (opcional)..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      {/* Results dropdown */}
      {showResults && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Buscando...
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul className="max-h-40 overflow-y-auto py-1">
              {results.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                    onClick={() => handleSelect(client)}
                  >
                    <span className="font-medium">{client.nombre}</span>
                    {client.rif_cedula && (
                      <span className="text-muted-foreground">
                        · {client.rif_cedula}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
