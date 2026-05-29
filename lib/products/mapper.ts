// DB row to API type transformer for Products
import type { Product } from "./types"
import type { Database } from "@/types/database"

type DbProduct = Database["public"]["Tables"]["products"]["Row"]

export function toProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    sku: row.sku,
    barcode: row.barcode,
    unit_type: row.unit_type as Product["unit_type"],
    base_unit: row.base_unit as Product["base_unit"],
    conversion_factor: Number(row.conversion_factor),
    price_usd: Number(row.price_usd),
    cost_usd: row.cost_usd ? Number(row.cost_usd) : null,
    current_stock: Number(row.current_stock),
    min_stock: Number(row.min_stock),
    is_active: row.is_active ?? false,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  }
}
