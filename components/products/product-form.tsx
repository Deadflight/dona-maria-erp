"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { ProductCreateSchema } from "@/lib/products/schemas"
import { createProduct, updateProduct } from "@/actions/products"
import type { Product, ProductCreate } from "@/lib/products/types"

const UNIT_TYPES = [
  { value: "unit", label: "Unit" },
  { value: "weight", label: "Weight" },
  { value: "length", label: "Length" },
  { value: "mixed", label: "Mixed" },
] as const

const BASE_UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "m", label: "Meter (m)" },
  { value: "cm", label: "Centimeter (cm)" },
  { value: "unit", label: "Unit" },
] as const

type FormState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

interface ProductFormProps {
  mode: "create" | "edit"
  product?: Product
}

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter()
  const [unitType, setUnitType] = useState(product?.unit_type ?? "unit")
  const [baseUnit, setBaseUnit] = useState(product?.base_unit ?? "unit")

  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      const raw = Object.fromEntries(formData)

      const data: ProductCreate = {
        name: (raw.name as string) ?? "",
        description: (raw.description as string) || null,
        category: (raw.category as string) ?? "",
        sku: (raw.sku as string) ?? "",
        barcode: (raw.barcode as string) || null,
        unit_type: (raw.unit_type as ProductCreate["unit_type"]) || "unit",
        base_unit: (raw.base_unit as ProductCreate["base_unit"]) || "unit",
        conversion_factor: Number(raw.conversion_factor) || 1,
        price_usd: Number(raw.price_usd) || 0,
        cost_usd: raw.cost_usd ? Number(raw.cost_usd) : null,
        current_stock: Number(raw.current_stock) ?? 0,
        min_stock: Number(raw.min_stock) ?? 0,
      }

      // Client-side validation with Zod
      const parsed = ProductCreateSchema.safeParse(data)
      if (!parsed.success) {
        const errors: Record<string, string[]> = {}
        for (const issue of parsed.error.issues) {
          const path = issue.path.join(".")
          if (!errors[path]) errors[path] = []
          errors[path].push(issue.message)
        }
        return { errors, message: "Please fix the errors below." }
      }

      // Call the server action
      if (mode === "create") {
        const result = await createProduct(parsed.data)
        if ("error" in result) {
          return { message: result.error }
        }
      } else {
        if (!product) return { message: "Product data is missing for edit mode." }
        const result = await updateProduct(product.id, parsed.data)
        if ("error" in result) {
          return { message: result.error }
        }
      }

      return { success: true }
    },
    { errors: {} }
  )

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      router.push("/products")
      router.refresh()
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            placeholder="Product name"
            aria-invalid={state.errors?.name ? true : undefined}
          />
          {state.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        {/* SKU */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="sku">
            SKU <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sku"
            name="sku"
            defaultValue={product?.sku}
            placeholder="e.g., PROD-001"
            disabled={mode === "edit"}
            aria-invalid={state.errors?.sku ? true : undefined}
          />
          {state.errors?.sku && (
            <p className="text-xs text-destructive">{state.errors.sku[0]}</p>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Input
            id="category"
            name="category"
            defaultValue={product?.category}
            placeholder="e.g., Herramientas"
            aria-invalid={state.errors?.category ? true : undefined}
          />
          {state.errors?.category && (
            <p className="text-xs text-destructive">{state.errors.category[0]}</p>
          )}
        </div>

        {/* Barcode */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            id="barcode"
            name="barcode"
            defaultValue={product?.barcode ?? ""}
            placeholder="Optional"
          />
          {state.errors?.barcode && (
            <p className="text-xs text-destructive">{state.errors.barcode[0]}</p>
          )}
        </div>

        {/* Description (full width) */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={product?.description ?? ""}
            placeholder="Product description (optional)"
            rows={3}
            className="h-20 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
            aria-invalid={state.errors?.description ? true : undefined}
          />
          {state.errors?.description && (
            <p className="text-xs text-destructive">
              {state.errors.description[0]}
            </p>
          )}
        </div>

        {/* Unit Type */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit_type">Unit Type</Label>
          <input type="hidden" name="unit_type" value={unitType} />
          <Select value={unitType} onValueChange={(val) => { if (val !== null) setUnitType(val as typeof unitType) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_TYPES.map((ut) => (
                <SelectItem key={ut.value} value={ut.value}>
                  {ut.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.unit_type && (
            <p className="text-xs text-destructive">{state.errors.unit_type[0]}</p>
          )}
        </div>

        {/* Base Unit */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="base_unit">Base Unit</Label>
          <input type="hidden" name="base_unit" value={baseUnit} />
          <Select value={baseUnit} onValueChange={(val) => { if (val !== null) setBaseUnit(val as typeof baseUnit) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASE_UNITS.map((bu) => (
                <SelectItem key={bu.value} value={bu.value}>
                  {bu.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.base_unit && (
            <p className="text-xs text-destructive">{state.errors.base_unit[0]}</p>
          )}
        </div>

        {/* Conversion Factor */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="conversion_factor">Conversion Factor</Label>
          <Input
            id="conversion_factor"
            name="conversion_factor"
            type="number"
            step="any"
            min="0.0001"
            defaultValue={product?.conversion_factor ?? 1}
          />
          {state.errors?.conversion_factor && (
            <p className="text-xs text-destructive">
              {state.errors.conversion_factor[0]}
            </p>
          )}
        </div>

        {/* Price USD */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="price_usd">
            Price (USD) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price_usd"
            name="price_usd"
            type="number"
            step="any"
            min="0"
            defaultValue={product?.price_usd}
            placeholder="0.00"
            aria-invalid={state.errors?.price_usd ? true : undefined}
          />
          {state.errors?.price_usd && (
            <p className="text-xs text-destructive">{state.errors.price_usd[0]}</p>
          )}
        </div>

        {/* Cost USD */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="cost_usd">Cost (USD)</Label>
          <Input
            id="cost_usd"
            name="cost_usd"
            type="number"
            step="any"
            min="0"
            defaultValue={product?.cost_usd ?? ""}
            placeholder="Optional"
          />
          {state.errors?.cost_usd && (
            <p className="text-xs text-destructive">{state.errors.cost_usd[0]}</p>
          )}
        </div>

        {/* Current Stock */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="current_stock">Current Stock</Label>
          <Input
            id="current_stock"
            name="current_stock"
            type="number"
            step="any"
            min="0"
            defaultValue={product?.current_stock ?? 0}
          />
          {state.errors?.current_stock && (
            <p className="text-xs text-destructive">
              {state.errors.current_stock[0]}
            </p>
          )}
        </div>

        {/* Min Stock */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="min_stock">Min Stock</Label>
          <Input
            id="min_stock"
            name="min_stock"
            type="number"
            step="any"
            min="0"
            defaultValue={product?.min_stock ?? 0}
          />
          {state.errors?.min_stock && (
            <p className="text-xs text-destructive">{state.errors.min_stock[0]}</p>
          )}
        </div>
      </div>

      {/* General error message */}
      {state.message && !state.errors && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link href="/products">
          <Button variant="outline" type="button" disabled={isPending}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Create Product"
              : "Update Product"}
        </Button>
      </div>
    </form>
  )
}
