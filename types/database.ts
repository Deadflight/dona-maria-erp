// Database types for Supabase
// These will be generated automatically when we connect to Supabase
// For now, this is a placeholder that matches our schema design

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          password_hash: string
          nombre_completo: string
          rol: "admin" | "operador"
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          nombre_completo: string
          rol?: "admin" | "operador"
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          nombre_completo?: string
          rol?: "admin" | "operador"
          activo?: boolean
          created_at?: string
        }
      }
      productos: {
        Row: {
          id: string
          codigo_barra: string | null
          descripcion: string
          tipo_unidad: "unidad" | "peso" | "longitud" | "mixto"
          unidad_base: "kg" | "m" | "cm" | "und"
          factor_conversion: number
          precio_venta_usd: number
          stock_actual: number
          stock_minimo: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo_barra?: string | null
          descripcion: string
          tipo_unidad: "unidad" | "peso" | "longitud" | "mixto"
          unidad_base: "kg" | "m" | "cm" | "und"
          factor_conversion?: number
          precio_venta_usd: number
          stock_actual?: number
          stock_minimo?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo_barra?: string | null
          descripcion?: string
          tipo_unidad?: "unidad" | "peso" | "longitud" | "mixto"
          unidad_base?: "kg" | "m" | "cm" | "und"
          factor_conversion?: number
          precio_venta_usd?: number
          stock_actual?: number
          stock_minimo?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nombre: string
          telefono: string | null
          direccion: string | null
          limite_credito_usd: number | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          telefono?: string | null
          direccion?: string | null
          limite_credito_usd?: number | null
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          telefono?: string | null
          direccion?: string | null
          limite_credito_usd?: number | null
          activo?: boolean
          created_at?: string
        }
      }
      ventas: {
        Row: {
          id: string
          fecha_hora: string
          id_usuario: string
          id_cliente: string | null
          tipo_venta: "contado" | "credito"
          estado: "completada" | "anulada"
          total_usd: number
          tasa_cambio_usd_a_ves: number
          total_ves: number
          created_at: string
        }
        Insert: {
          id?: string
          fecha_hora?: string
          id_usuario: string
          id_cliente?: string | null
          tipo_venta: "contado" | "credito"
          estado?: "completada" | "anulada"
          total_usd: number
          tasa_cambio_usd_a_ves: number
          total_ves: number
          created_at?: string
        }
        Update: {
          id?: string
          fecha_hora?: string
          id_usuario?: string
          id_cliente?: string | null
          tipo_venta?: "contado" | "credito"
          estado?: "completada" | "anulada"
          total_usd?: number
          tasa_cambio_usd_a_ves?: number
          total_ves?: number
          created_at?: string
        }
      }
      detalles_venta: {
        Row: {
          id: string
          id_venta: string
          id_producto: string
          cantidad: number
          precio_unitario_usd: number
          unidad_usada: string
        }
        Insert: {
          id?: string
          id_venta: string
          id_producto: string
          cantidad: number
          precio_unitario_usd: number
          unidad_usada: string
        }
        Update: {
          id?: string
          id_venta?: string
          id_producto?: string
          cantidad?: number
          precio_unitario_usd?: number
          unidad_usada?: string
        }
      }
      pagos_venta: {
        Row: {
          id: string
          id_venta: string
          metodo_pago: "efectivo" | "pagomovil" | "debito"
          banco: "banesco" | "mercantil" | "venezuela"
          monto_ves: number
          created_at: string
        }
        Insert: {
          id?: string
          id_venta: string
          metodo_pago: "efectivo" | "pagomovil" | "debito"
          banco: "banesco" | "mercantil" | "venezuela"
          monto_ves: number
          created_at?: string
        }
        Update: {
          id?: string
          id_venta?: string
          metodo_pago?: "efectivo" | "pagomovil" | "debito"
          banco?: "banesco" | "mercantil" | "venezuela"
          monto_ves?: number
          created_at?: string
        }
      }
      creditos: {
        Row: {
          id: string
          id_venta: string
          id_cliente: string
          monto_total_usd: number
          monto_pagado_usd: number
          saldo_pendiente_usd: number
          fecha_venta: string
          fecha_vencimiento: string
          estado: "pendiente" | "saldado" | "mora"
          created_at: string
        }
        Insert: {
          id?: string
          id_venta: string
          id_cliente: string
          monto_total_usd: number
          monto_pagado_usd?: number
          fecha_venta?: string
          fecha_vencimiento: string
          estado?: "pendiente" | "saldado" | "mora"
          created_at?: string
        }
        Update: {
          id?: string
          id_venta?: string
          id_cliente?: string
          monto_total_usd?: number
          monto_pagado_usd?: number
          fecha_venta?: string
          fecha_vencimiento?: string
          estado?: "pendiente" | "saldado" | "mora"
          created_at?: string
        }
      }
      abonos_creditos: {
        Row: {
          id: string
          id_credito: string
          monto_usd: number
          monto_ves: number
          metodo_pago: string
          banco: string
          fecha_hora: string
        }
        Insert: {
          id?: string
          id_credito: string
          monto_usd: number
          monto_ves: number
          metodo_pago: string
          banco: string
          fecha_hora?: string
        }
        Update: {
          id?: string
          id_credito?: string
          monto_usd?: number
          monto_ves?: number
          metodo_pago?: string
          banco?: string
          fecha_hora?: string
        }
      }
      tasas_cambio: {
        Row: {
          id: string
          tasa: number
          fuente: "api_bcv" | "manual" | "fallida"
          fecha: string
          created_at: string
        }
        Insert: {
          id?: string
          tasa: number
          fuente?: "api_bcv" | "manual" | "fallida"
          fecha: string
          created_at?: string
        }
        Update: {
          id?: string
          tasa?: number
          fuente?: "api_bcv" | "manual" | "fallida"
          fecha?: string
          created_at?: string
        }
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
  }
}

// Convenient types for common queries
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"]
export type Producto = Database["public"]["Tables"]["productos"]["Row"]
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"]
export type Venta = Database["public"]["Tables"]["ventas"]["Row"]
export type DetalleVenta = Database["public"]["Tables"]["detalles_venta"]["Row"]
export type PagoVenta = Database["public"]["Tables"]["pagos_venta"]["Row"]
export type Credito = Database["public"]["Tables"]["creditos"]["Row"]
export type AbonoCredito = Database["public"]["Tables"]["abonos_creditos"]["Row"]
export type TasaCambio = Database["public"]["Tables"]["tasas_cambio"]["Row"]

export type RolUsuario = "admin" | "operador"
export type TipoUnidad = "unidad" | "peso" | "longitud" | "mixto"
export type UnidadBase = "kg" | "m" | "cm" | "und"
export type TipoVenta = "contado" | "credito"
export type EstadoVenta = "completada" | "anulada"
export type MetodoPago = "efectivo" | "pagomovil" | "debito"
export type Banco = "banesco" | "mercantil" | "venezuela"
export type EstadoCredito = "pendiente" | "saldado" | "mora"
export type FuenteTasa = "api_bcv" | "manual" | "fallida"