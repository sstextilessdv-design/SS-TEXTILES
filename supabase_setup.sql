-- SS Textiles Gifts - Supabase setup
-- Run this entire script in Supabase Dashboard -> SQL Editor.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(12,2) not null default 0,
  description text default '',
  image_url text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  total numeric(12,2) not null default 0,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public customers can read products.
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products for select
to anon, authenticated
using (true);

-- Only signed-in admin users can manage products.
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products for insert
to authenticated
with check (true);

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products for update
to authenticated
using (true) with check (true);

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products for delete
to authenticated
using (true);

-- Customers can create orders and order items without logging in.
drop policy if exists "Customers can create orders" on public.orders;
create policy "Customers can create orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Customers can create order items" on public.order_items;
create policy "Customers can create order items"
on public.order_items for insert
to anon, authenticated
with check (true);

-- Only signed-in admins can view/update orders from the dashboard/site.
drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders for select
to authenticated
using (true);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
to authenticated
using (true) with check (true);

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items for select
to authenticated
using (true);

-- Product image storage bucket.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Public customers can view product images.
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

-- Signed-in admins can upload/update/delete product images.
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');
