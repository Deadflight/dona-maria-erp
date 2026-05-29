export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
      clients: {
        Row: {
          address: string | null
          business_name: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          rut: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          rut?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          rut?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_payments: {
        Row: {
          amount_usd: number
          created_at: string | null
          credit_id: string
          id: string
          is_active: boolean | null
          payment_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount_usd: number
          created_at?: string | null
          credit_id: string
          id?: string
          is_active?: boolean | null
          payment_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_usd?: number
          created_at?: string | null
          credit_id?: string
          id?: string
          is_active?: boolean | null
          payment_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_payments_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "credits"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          client_id: string
          created_at: string | null
          due_date: string
          id: string
          is_active: boolean | null
          paid_usd: number | null
          sale_id: string | null
          status: string | null
          total_usd: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          due_date: string
          id?: string
          is_active?: boolean | null
          paid_usd?: number | null
          sale_id?: string | null
          status?: string | null
          total_usd: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          is_active?: boolean | null
          paid_usd?: number | null
          sale_id?: string | null
          status?: string | null
          total_usd?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string | null
          effective_date: string
          from_currency: string
          id: string
          is_active: boolean | null
          rate: number
          to_currency: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          from_currency: string
          id?: string
          is_active?: boolean | null
          rate: number
          to_currency: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          from_currency?: string
          id?: string
          is_active?: boolean | null
          rate?: number
          to_currency?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          base_unit: string
          category: string
          conversion_factor: number | null
          cost_usd: number | null
          created_at: string | null
          current_stock: number
          description: string | null
          id: string
          is_active: boolean | null
          min_stock: number
          name: string
          price_usd: number
          sku: string
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          base_unit?: string
          category: string
          conversion_factor?: number | null
          cost_usd?: number | null
          created_at?: string | null
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock?: number
          name: string
          price_usd: number
          sku: string
          unit_type?: string
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          base_unit?: string
          category?: string
          conversion_factor?: number | null
          cost_usd?: number | null
          created_at?: string | null
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock?: number
          name?: string
          price_usd?: number
          sku?: string
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string
          quantity: number
          sale_id: string
          subtotal_usd: number
          unit_price_usd: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          quantity: number
          sale_id: string
          subtotal_usd: number
          unit_price_usd: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          quantity?: number
          sale_id?: string
          subtotal_usd?: number
          unit_price_usd?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount_usd: number
          created_at: string | null
          id: string
          is_active: boolean | null
          payment_date: string | null
          payment_method: string | null
          sale_id: string
          updated_at: string | null
        }
        Insert: {
          amount_usd: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_date?: string | null
          payment_method?: string | null
          sale_id: string
          updated_at?: string | null
        }
        Update: {
          amount_usd?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_date?: string | null
          payment_method?: string | null
          sale_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          status: string
          total_usd: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          status?: string
          total_usd: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          status?: string
          total_usd?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

