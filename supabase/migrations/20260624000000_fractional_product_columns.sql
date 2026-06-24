-- ===================================================================
-- Migration: fractional_product_columns
-- Description: Add unit-type metadata columns to productos
-- ===================================================================

-- -------------------------------------------------------------------
-- Step 1: Add tipo_unidad — product unit classification
-- -------------------------------------------------------------------
alter table public.productos
  add column if not exists tipo_unidad text
    not null
    default 'unidad'
    check (tipo_unidad in ('unidad', 'peso', 'longitud', 'mixto'));

-- -------------------------------------------------------------------
-- Step 2: Add unidad_base — base unit of measure for this product
-- -------------------------------------------------------------------
alter table public.productos
  add column if not exists unidad_base text
    not null
    default 'und'
    check (unidad_base in ('und', 'kg', 'm', 'cm'));

-- -------------------------------------------------------------------
-- Step 3: Add factor_conversion — conversion factor to base unit
-- -------------------------------------------------------------------
alter table public.productos
  add column if not exists factor_conversion numeric(10,2)
    not null
    default 1
    check (factor_conversion > 0);

-- ===================================================================
-- Note: Existing `unidad_medida` text column is preserved alongside
-- the new columns for backward compatibility.
-- ===================================================================
