-- =========================================================
-- 0002_rls.sql
-- Row Level Security: cada rol ve/edita solo lo que le corresponde
-- =========================================================

alter table profiles enable row level security;
alter table ingredients enable row level security;
alter table products enable row level security;
alter table flavors enable row level security;
alter table recipes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Helper: rol del usuario autenticado actual
create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- ---------- PROFILES ----------
create policy "usuarios ven su propio perfil"
  on profiles for select
  using (id = auth.uid());

create policy "propietario ve todos los perfiles"
  on profiles for select
  using (auth_role() = 'propietario');

create policy "propietario administra perfiles"
  on profiles for all
  using (auth_role() = 'propietario')
  with check (auth_role() = 'propietario');

-- ---------- INGREDIENTS ----------
create policy "roles autenticados leen ingredientes"
  on ingredients for select
  using (auth.uid() is not null);

create policy "propietario administra ingredientes"
  on ingredients for all
  using (auth_role() = 'propietario')
  with check (auth_role() = 'propietario');

-- ---------- PRODUCTS ----------
create policy "roles autenticados leen productos"
  on products for select
  using (auth.uid() is not null);

create policy "propietario administra productos"
  on products for all
  using (auth_role() = 'propietario')
  with check (auth_role() = 'propietario');

-- ---------- FLAVORS ----------
create policy "roles autenticados leen sabores"
  on flavors for select
  using (auth.uid() is not null);

create policy "propietario y supervisor administran sabores"
  on flavors for all
  using (auth_role() in ('propietario', 'supervisor'))
  with check (auth_role() in ('propietario', 'supervisor'));

-- ---------- RECIPES ----------
create policy "roles autenticados leen recetas"
  on recipes for select
  using (auth.uid() is not null);

create policy "propietario administra recetas"
  on recipes for all
  using (auth_role() = 'propietario')
  with check (auth_role() = 'propietario');

-- ---------- ORDERS ----------
create policy "mesero ve sus propias ordenes"
  on orders for select
  using (mesero_id = auth.uid());

create policy "supervisor cocina y propietario ven todas las ordenes"
  on orders for select
  using (auth_role() in ('supervisor', 'cocina', 'propietario'));

create policy "mesero crea sus propias ordenes"
  on orders for insert
  with check (mesero_id = auth.uid() and auth_role() = 'mesero');

create policy "cocina y supervisor actualizan estado de ordenes"
  on orders for update
  using (auth_role() in ('cocina', 'supervisor', 'propietario'))
  with check (auth_role() in ('cocina', 'supervisor', 'propietario'));

-- ---------- ORDER ITEMS ----------
create policy "ver items de ordenes visibles"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.mesero_id = auth.uid() or auth_role() in ('supervisor', 'cocina', 'propietario'))
    )
  );

create policy "mesero inserta items en sus propias ordenes"
  on order_items for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.mesero_id = auth.uid()
    )
  );
