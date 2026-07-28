-- ===================================================================
-- Migration: daily_close
-- Description: Cierres diarios — tabla para registrar el cierre
--              financiero diario con arqueo de caja y discrepancias.
-- ===================================================================

-- -------------------------------------------------------------------
-- Table: cierres_diarios
-- -------------------------------------------------------------------
create table if not exists public.cierres_diarios (
  id          uuid primary key default uuid_generate_v4(),
  fecha       date unique not null,
  cerrado_by  uuid not null references public.profiles(id),
  totales_json jsonb not null default '{}',
  monto_fisico   numeric(14,2) not null default 0,
  monto_sistema  numeric(14,2) not null default 0,
  discrepancia   numeric(14,2) not null default 0,
  observaciones  text,
  created_at     timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.cierres_diarios enable row level security;

-- Admin has full access (insert, select, update, delete)
create policy "cierres_diarios_admin_all" on public.cierres_diarios
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- Viewer+ can read (viewer, seller, admin)
create policy "cierres_diarios_viewer_select" on public.cierres_diarios
  for select to authenticated
  using (public.get_user_role() in ('viewer', 'seller', 'admin'));
