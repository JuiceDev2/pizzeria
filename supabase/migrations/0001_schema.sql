-- =========================================================
-- 0001_schema.sql
-- Esquema base del sistema administrativo de pizzería
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
create type user_role as enum ('propietario', 'supervisor', 'cocina', 'mesero');
create type product_category as enum ('pizza', 'boneless', 'papas', 'bebida');
create type order_status as enum ('pendiente', 'lista', 'entregada', 'cancelada');
create type pizza_style as enum ('normal', 'dorada');

-- ---------- PROFILES (1:1 con auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- INGREDIENTS (materias primas) ----------
create table ingredients (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  stock_grams numeric(12, 2) not null default 0 check (stock_grams >= 0),
  min_threshold_grams numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table products (
  id uuid primary key default uuid_generate_v4(),
  category product_category not null,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true
);

-- ---------- FLAVORS (sabores, aplican a pizza/boneless/papas) ----------
create table flavors (
  id uuid primary key default uuid_generate_v4(),
  product_category product_category not null,
  name text not null,
  active boolean not null default true
);

-- ---------- RECIPES (cuántos gramos de cada ingrediente usa un producto+sabor) ----------
create table recipes (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  flavor_id uuid references flavors(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  grams_used numeric(10, 2) not null check (grams_used > 0),
  unique (product_id, flavor_id, ingredient_id)
);

-- ---------- ORDERS ----------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  mesero_id uuid not null references profiles(id),
  status order_status not null default 'pendiente',
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ORDER ITEMS ----------
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  flavor_id uuid references flavors(id),
  size text,
  style pizza_style,
  orilla_queso boolean not null default false,
  price numeric(10, 2) not null,
  qty integer not null check (qty > 0)
);

-- ---------- ÍNDICES para las consultas más frecuentes ----------
create index idx_orders_status_created on orders (status, created_at);
create index idx_order_items_order_id on order_items (order_id);
create index idx_recipes_product_flavor on recipes (product_id, flavor_id);

-- ---------- trigger: mantiene updated_at fresco en orders ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_updated_at
before update on orders
for each row execute function set_updated_at();
