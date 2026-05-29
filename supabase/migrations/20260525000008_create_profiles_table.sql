-- ===================================================================
-- Migration: create_profiles_table
-- Description: User profiles extending auth.users with role-based access
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: profiles
-- -------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'seller' check (role in ('admin', 'seller', 'viewer')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "authenticated_all" on public.profiles
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- -------------------------------------------------------------------
-- Auto-create profile on user signup
-- -------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
