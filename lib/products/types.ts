// API domain types for Products (English field names matching DB schema)

export type Product = {
  id: string
  name: string
  description: string | null
  category: string
  sku: string
  barcode: string | null
  unit_type: "unit" | "weight" | "length" | "mixed"
  base_unit: "kg" | "g" | "m" | "cm" | "unit"
  conversion_factor: number
  price_usd: number
  cost_usd: number | null
  current_stock: number
  min_stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductCreate = {
  name: string
  description?: string | null
  category: string
  sku: string
  barcode?: string | null
  unit_type?: "unit" | "weight" | "length" | "mixed"
  base_unit?: "kg" | "g" | "m" | "cm" | "unit"
  conversion_factor?: number
  price_usd: number
  cost_usd?: number | null
  current_stock?: number
  min_stock?: number
}

export type ProductUpdate = Partial<ProductCreate>

export type ProductSearch = {
  query?: string
  category?: string
  page?: number
  perPage?: number
}

export type ProductSearchResult = {
  data: Product[]
  count: number
  page: number
  perPage: number
  totalPages: number
}
