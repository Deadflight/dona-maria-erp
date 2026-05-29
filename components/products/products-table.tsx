"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { DeleteProductDialog } from "./delete-product-dialog"
import type { Product } from "@/lib/products/types"
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"

const CATEGORIES = [
  "Herramientas",
  "Material Eléctrico",
  "Fontanería",
  "Pinturas",
  "Ferretería General",
  "Jardinería",
  "Seguridad",
  "Otros",
] as const

interface ProductsTableProps {
  products: Product[]
  totalPages: number
  currentPage: number
  query: string
  category: string
}

export function ProductsTable({
  products,
  totalPages,
  currentPage,
  query,
  category,
}: ProductsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(query)
  const [searchCategory, setSearchCategory] = useState(category || "all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [deleteProductName, setDeleteProductName] = useState("")

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      return `/products?${params.toString()}`
    },
    [searchParams]
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const categoryValue = searchCategory === "all" ? "" : searchCategory
    router.push(buildUrl({ query: searchQuery || null, category: categoryValue || null, page: "1" }))
  }

  function goToPage(page: number) {
    router.push(buildUrl({ page: String(page) }))
  }

  function openDeleteDialog(product: Product) {
    setDeleteProductId(product.id)
    setDeleteProductName(product.name)
    setDeleteDialogOpen(true)
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setDeleteDialogOpen(open)
    if (!open) {
      setDeleteProductId(null)
      setDeleteProductName("")
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link href="/products/new">
          <Button>
            <Plus className="size-4" />
            New Product
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="query"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={searchCategory} onValueChange={(val) => { if (val !== null) setSearchCategory(val) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price (USD)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{formatPrice(product.price_usd)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        product.current_stock <= product.min_stock
                          ? "font-medium text-destructive"
                          : ""
                      }
                    >
                      {product.current_stock} {product.base_unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteDialog(product)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      {deleteProductId && (
        <DeleteProductDialog
          productId={deleteProductId}
          productName={deleteProductName}
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
        />
      )}
    </div>
  )
}
