-- ===================================================================
-- Migration: create_initial_schema
-- Description: DDL para ferretería MVP - 10 tablas con RLS
-- ===================================================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------
-- TABLA: perfiles (extensión de auth.users)
-- -------------------------------------------------------------------
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  rol text not null default 'operador' check (rol in ('admin', 'operador', 'contador')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.perfiles enable row level security;

-- Admin ve todo, operador ve solo su perfil
create policy "perfiles_todos" on public.perfiles
  for select to authenticated using (true);

create policy "perfiles_insertar_propio" on public.perfiles
  for insert to authenticated with check (auth.uid() = id);

create policy "perfiles_actualizar_propio" on public.perfiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- -------------------------------------------------------------------
-- TABLA: productos
-- -------------------------------------------------------------------
create table if not exists public.productos (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  nombre text not null,
  descripcion text,
  categoria text not null,
  precio_venta numeric(12,2) not null check (precio_venta >= 0),
  precio_compra numeric(12,2) check (precio_compra >= 0),
  stock_actual integer not null default 0 check (stock_actual >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  unidad_medida text not null default 'unidad',
  codigo_barras text,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.productos enable row level security;

create policy "productos_lectura" on public.productos
  for select to authenticated using (activo = true);

create policy "productos_admin_all" on public.productos
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  ));

-- -------------------------------------------------------------------
-- TABLA: clientes
-- -------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  telefono text,
  email text,
  direccion text,
  rif_cedula text unique,
  tipo text not null default 'natural' check (tipo in ('natural', 'juridico')),
  limite_credito numeric(14,2) default 0 check (limite_credito >= 0),
  saldo_actual numeric(14,2) default 0,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clientes enable row level security;

create policy "clientes_lectura_todos" on public.clientes
  for select to authenticated using (activo = true);

create policy "clientes_admin_all" on public.clientes
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('admin', 'contador')
  ));

-- -------------------------------------------------------------------
-- TABLA: ventas
-- -------------------------------------------------------------------
create table if not exists public.ventas (
  id uuid primary key default uuid_generate_v4(),
  numero_factura text unique not null,
  cliente_id uuid references public.clientes(id),
  vendedor_id uuid references public.perfiles(id),
  subtotal numeric(14,2) not null default 0,
  impuesto numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'pago_movil', 'transferencia', 'divisa', 'mixto')),
  estado text not null default 'completada' check (estado in ('completada', 'anulada', 'credito')),
  observaciones text,
  created_at timestamptz default now()
);

alter table public.ventas enable row level security;

create policy "ventas_lectura_operador" on public.ventas
  for select to authenticated using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol in ('admin', 'contador')
    )
    or vendedor_id = auth.uid()
  );

create policy "ventas_admin_all" on public.ventas
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  ));

-- -------------------------------------------------------------------
-- TABLA: detalles_venta
-- -------------------------------------------------------------------
create table if not exists public.detalles_venta (
  id uuid primary key default uuid_generate_v4(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null,
  descuento numeric(12,2) default 0,
  subtotal numeric(12,2) not null,
  created_at timestamptz default now()
);

alter table public.detalles_venta enable row level security;

create policy "detalles_venta_lectura" on public.detalles_venta
  for select to authenticated using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol in ('admin', 'contador')
    )
    or exists (
      select 1 from public.ventas v
      where v.id = venta_id and v.vendedor_id = auth.uid()
    )
  );

create policy "detalles_venta_admin_all" on public.detalles_venta
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  ));

-- -------------------------------------------------------------------
-- TABLA: pagos_venta
-- -------------------------------------------------------------------
create table if not exists public.pagos_venta (
  id uuid primary key default uuid_generate_v4(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  monto numeric(14,2) not null,
  metodo_pago text not null,
  referencia text,
  banco text,
  created_at timestamptz default now()
);

alter table public.pagos_venta enable row level security;

create policy "pagos_venta_lectura" on public.pagos_venta
  for select to authenticated using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol in ('admin', 'contador')
    )
    or exists (
      select 1 from public.ventas v
      where v.id = venta_id and v.vendedor_id = auth.uid()
    )
  );

create policy "pagos_venta_admin_all" on public.pagos_venta
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  ));

-- -------------------------------------------------------------------
-- TABLA: creditos
-- -------------------------------------------------------------------
create table if not exists public.creditos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references public.clientes(id),
  venta_id uuid references public.ventas(id),
  monto_original numeric(14,2) not null,
  saldo_pendiente numeric(14,2) not null,
  tasa_interes numeric(5,2) default 0,
  cuotas integer default 1,
  fecha_otorgamiento date not null default current_date,
  fecha_vencimiento date not null,
  estado text not null default 'activo' check (estado in ('activo', 'cancelado', 'vencido', 'anulado')),
  created_at timestamptz default now()
);

alter table public.creditos enable row level security;

create policy "creditos_lectura" on public.creditos
  for select to authenticated using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol in ('admin', 'contador')
    )
  );

create policy "creditos_admin_all" on public.creditos
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  ));

-- -------------------------------------------------------------------
-- TABLA: abonos_creditos
-- -------------------------------------------------------------------
create table if not exists public.abonos_creditos (
  id uuid primary key default uuid_generate_v4(),
  credito_id uuid not null references public.creditos(id) on delete cascade,
  monto numeric(14,2) not null,
  fecha_abono date not null default current_date,
  metodo_pago text not null,
  referencia text,
  created_at timestamptz default now()
);

alter table public.abonos_creditos enable row level security;

create policy "abonos_lectura" on public.abonos_creditos
  for select to authenticated using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol in ('admin', 'contador')
    )
  );

create policy "abonos_admin_all" on public.abonos_creditos
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  ));

-- -------------------------------------------------------------------
-- TABLA: tasas_cambio
-- -------------------------------------------------------------------
create table if not exists public.tasas_cambio (
  id uuid primary key default uuid_generate_v4(),
  moneda_origen text not null default 'USD',
  moneda_destino text not null default 'VES',
  tasa numeric(14,4) not null,
  fuente text not null default 'BCV',
  fecha date not null default current_date,
  activa boolean default true,
  created_at timestamptz default now()
);

alter table public.tasas_cambio enable row level security;

create policy "tasas_lectura" on public.tasas_cambio
  for select to authenticated using (activa = true);

create policy "tasas_admin_all" on public.tasas_cambio
  for all to authenticated
  using (exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('admin', 'contador')
  ));

-- -------------------------------------------------------------------
-- FUNCIONES DE AUDITORÍA
-- -------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Función para actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger perfiles_updated_at
  before update on public.perfiles
  for each row execute procedure public.handle_updated_at();

create trigger productos_updated_at
  before update on public.productos
  for each row execute procedure public.handle_updated_at();

create trigger clientes_updated_at
  before update on public.clientes
  for each row execute procedure public.handle_updated_at();