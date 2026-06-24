export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Fractional product unit types (added via migration 20260624000000)
// ---------------------------------------------------------------------------
export type TipoUnidad = "unidad" | "peso" | "longitud" | "mixto"
export type UnidadBase = "und" | "kg" | "m" | "cm"

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      abonos_creditos: {
        Row: {
          created_at: string | null
          credito_id: string
          fecha_abono: string
          id: string
          metodo_pago: string
          monto: number
          referencia: string | null
        }
        Insert: {
          created_at?: string | null
          credito_id: string
          fecha_abono?: string
          id?: string
          metodo_pago: string
          monto: number
          referencia?: string | null
        }
        Update: {
          created_at?: string | null
          credito_id?: string
          fecha_abono?: string
          id?: string
          metodo_pago?: string
          monto?: number
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abonos_creditos_credito_id_fkey"
            columns: ["credito_id"]
            isOneToOne: false
            referencedRelation: "creditos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: string
          limite_credito: number | null
          nombre: string
          rif_cedula: string | null
          saldo_actual: number | null
          telefono: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number | null
          nombre: string
          rif_cedula?: string | null
          saldo_actual?: number | null
          telefono?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number | null
          nombre?: string
          rif_cedula?: string | null
          saldo_actual?: number | null
          telefono?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      creditos: {
        Row: {
          cliente_id: string
          created_at: string | null
          cuotas: number | null
          estado: string
          fecha_otorgamiento: string
          fecha_vencimiento: string
          id: string
          monto_original: number
          saldo_pendiente: number
          tasa_interes: number | null
          venta_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          cuotas?: number | null
          estado?: string
          fecha_otorgamiento?: string
          fecha_vencimiento: string
          id?: string
          monto_original: number
          saldo_pendiente: number
          tasa_interes?: number | null
          venta_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          cuotas?: number | null
          estado?: string
          fecha_otorgamiento?: string
          fecha_vencimiento?: string
          id?: string
          monto_original?: number
          saldo_pendiente?: number
          tasa_interes?: number | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creditos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          id: string
          producto_id: string
          cantidad: number
          tipo_movimiento: string
          stock_resultante: number
          referencia_tipo: string | null
          referencia_id: string | null
          motivo: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          producto_id: string
          cantidad: number
          tipo_movimiento: string
          stock_resultante: number
          referencia_tipo?: string | null
          referencia_id?: string | null
          motivo?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          producto_id?: string
          cantidad?: number
          tipo_movimiento?: string
          stock_resultante?: number
          referencia_tipo?: string | null
          referencia_id?: string | null
          motivo?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      detalles_venta: {
        Row: {
          cantidad: number
          created_at: string | null
          descuento: number | null
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          descuento?: number | null
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          descuento?: number | null
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalles_venta_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalles_venta_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_venta: {
        Row: {
          banco: string | null
          created_at: string | null
          id: string
          metodo_pago: string
          monto: number
          referencia: string | null
          venta_id: string
        }
        Insert: {
          banco?: string | null
          created_at?: string | null
          id?: string
          metodo_pago: string
          monto: number
          referencia?: string | null
          venta_id: string
        }
        Update: {
          banco?: string | null
          created_at?: string | null
          id?: string
          metodo_pago?: string
          monto?: number
          referencia?: string | null
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_venta_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean
          role: "admin" | "seller" | "viewer"
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: "admin" | "seller" | "viewer"
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: "admin" | "seller" | "viewer"
          updated_at?: string | null
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean | null
          created_at: string | null
          created_by: string | null
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          ruc: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          ruc?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          ruc?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          numero_recepcion: string
          observaciones: string | null
          proveedor_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          numero_recepcion: string
          observaciones?: string | null
          proveedor_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          numero_recepcion?: string
          observaciones?: string | null
          proveedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_items: {
        Row: {
          cantidad_recibida: number
          created_at: string | null
          id: string
          precio_compra: number
          producto_id: string
          recepcion_id: string
        }
        Insert: {
          cantidad_recibida: number
          created_at?: string | null
          id?: string
          precio_compra: number
          producto_id: string
          recepcion_id: string
        }
        Update: {
          cantidad_recibida?: number
          created_at?: string | null
          id?: string
          precio_compra?: number
          producto_id?: string
          recepcion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_recepcion_id_fkey"
            columns: ["recepcion_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria: string
          codigo_barras: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          precio_compra: number | null
          precio_venta: number
          sku: string
          stock_actual: number
          stock_minimo: number
          tipo_unidad: string
          unidad_base: string
          factor_conversion: number
          unidad_medida: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          codigo_barras?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          precio_compra?: number | null
          precio_venta: number
          sku: string
          stock_actual?: number
          stock_minimo?: number
          tipo_unidad?: string
          unidad_base?: string
          factor_conversion?: number
          unidad_medida?: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          codigo_barras?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_compra?: number | null
          precio_venta?: number
          sku?: string
          stock_actual?: number
          stock_minimo?: number
          tipo_unidad?: string
          unidad_base?: string
          factor_conversion?: number
          unidad_medida?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasas_cambio: {
        Row: {
          activa: boolean | null
          created_at: string | null
          fecha: string
          fuente: string
          id: string
          moneda_destino: string
          moneda_origen: string
          tasa: number
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          fecha?: string
          fuente?: string
          id?: string
          moneda_destino?: string
          moneda_origen?: string
          tasa: number
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          fecha?: string
          fuente?: string
          id?: string
          moneda_destino?: string
          moneda_origen?: string
          tasa?: number
        }
        Relationships: []
      }
      ventas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: string
          id: string
          impuesto: number
          metodo_pago: string
          numero_factura: string
          observaciones: string | null
          subtotal: number
          total: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          impuesto?: number
          metodo_pago: string
          numero_factura: string
          observaciones?: string | null
          subtotal?: number
          total: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          impuesto?: number
          metodo_pago?: string
          numero_factura?: string
          observaciones?: string | null
          subtotal?: number
          total?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stock_from_movements: {
        Row: {
          producto_id: string
          stock_actual: number
        }
        Insert: {
          [_ in never]: never
        }
        Update: {
          [_ in never]: never
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["producto_id"]
          },
        ]
      }
    }
    Functions: {
      record_inventory_movement: {
        Args: {
          p_producto_id: string
          p_cantidad: number
          p_tipo_movimiento: string
          p_referencia_tipo?: string
          p_referencia_id?: string
          p_motivo?: string
        }
        Returns: string
      }
      get_stock_alerts: {
        Args: {
          p_search?: string
          p_categoria?: string
          p_page?: number
          p_page_size?: number
          p_activo?: boolean
        }
        Returns: Json
      }
      bulk_update_prices: {
        Args: {
          p_ids: string[]
          p_porcentaje: number
        }
        Returns: Json
      }
      get_stock_alert_count: {
        Args: Record<string, never>
        Returns: number
      }
      generate_receipt_number: {
        Args: Record<string, never>
        Returns: string
      }
      create_receipt_with_movements: {
        Args: {
          p_proveedor_id: string
          p_items: Json
          p_numero_recepcion?: string | null
          p_observaciones?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      TipoUnidad: TipoUnidad
      UnidadBase: UnidadBase
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      TipoUnidad: ["unidad", "peso", "longitud", "mixto"] as const,
      UnidadBase: ["und", "kg", "m", "cm"] as const,
    },
  },
} as const