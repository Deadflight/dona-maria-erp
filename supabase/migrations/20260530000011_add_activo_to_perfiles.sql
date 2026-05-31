-- ===================================================================
-- Migration: add_is_active_to_profiles
-- Description: Add is_active boolean column to profiles for user
--              deactivation support. Defaults to true (active).
-- ===================================================================

ALTER TABLE public.profiles
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Update any existing profiles that might need to be inactive
-- (None by default — all existing users remain active)
