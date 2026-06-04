-- ===================================================================
-- Migration: fractional_detalles_venta
-- Description: Change detalles_venta.cantidad from integer to numeric(10,2)
--              to support fractional product quantities (kg, m/cm)
-- ===================================================================

alter table public.detalles_venta
  alter column cantidad type numeric(10,2)
  using cantidad::numeric(10,2);
