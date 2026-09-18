create extension if not exists pgcrypto;

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  hotel_name text not null,
  gst_enabled boolean not null default false,
  cook_enabled boolean not null default false,
  service_charge_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text not null,
  role text not null check (role in ('admin', 'owner', 'waiter', 'cook')),
  hotel_id uuid references public.hotels(id) on delete set null,
  display_name text not null,
  phone text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_id_not_blank check (length(trim(login_id)) > 0),
  constraint profiles_role_hotel_check check ((role = 'admin' and hotel_id is null) or (role <> 'admin' and hotel_id is not null))
);

create unique index profiles_login_id_lower_idx on public.profiles (lower(login_id));

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  item_name text not null,
  price numeric(12, 2) not null check (price >= 0),
  category text not null default 'General',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_hotel_id_idx on public.menu_items (hotel_id);

create table public.table_configs (
  hotel_id uuid primary key references public.hotels(id) on delete cascade,
  table_count integer not null default 10 check (table_count >= 1),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  order_number integer not null check (order_number >= 101),
  table_number integer not null check (table_number >= 1),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  gst numeric(12, 2) not null default 0 check (gst >= 0),
  service numeric(12, 2) not null default 0 check (service >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  status text not null default 'OPEN' check (status in ('OPEN', 'COMPLETED')),
  kitchen_status text not null default 'PENDING' check (kitchen_status in ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED')),
  waiter_id uuid references public.profiles(id) on delete set null,
  waiter_name text,
  order_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, order_number)
);

create index orders_hotel_status_date_idx on public.orders (hotel_id, status, order_date desc);
create index orders_hotel_table_open_idx on public.orders (hotel_id, table_number) where status = 'OPEN';

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  price numeric(12, 2) not null check (price >= 0),
  quantity integer not null check (quantity >= 1),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hotels_set_updated_at before update on public.hotels
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger menu_items_set_updated_at before update on public.menu_items
for each row execute function public.set_updated_at();
create trigger table_configs_set_updated_at before update on public.table_configs
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_hotel_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hotel_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'owner', false);
$$;

create or replace function public.owns_hotel(target_hotel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.current_hotel_id() = target_hotel_id;
$$;

revoke all on function public.current_role() from public;
revoke all on function public.current_hotel_id() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_owner() from public;
revoke all on function public.owns_hotel(uuid) from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.current_hotel_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.owns_hotel(uuid) to authenticated;

alter table public.hotels enable row level security;
alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.table_configs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy hotels_select on public.hotels for select to authenticated
using (public.owns_hotel(id));
create policy hotels_insert on public.hotels for insert to authenticated
with check (public.is_admin());
create policy hotels_update on public.hotels for update to authenticated
using (public.is_admin() or (public.is_owner() and id = public.current_hotel_id()))
with check (public.is_admin() or (public.is_owner() and id = public.current_hotel_id()));
create policy hotels_delete on public.hotels for delete to authenticated
using (public.is_admin());

create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin() or (public.is_owner() and hotel_id = public.current_hotel_id()));
create policy profiles_update on public.profiles for update to authenticated
using (public.is_admin() or (public.is_owner() and role in ('waiter', 'cook') and hotel_id = public.current_hotel_id()))
with check (public.is_admin() or (public.is_owner() and role in ('waiter', 'cook') and hotel_id = public.current_hotel_id()));
create policy profiles_delete on public.profiles for delete to authenticated
using (public.is_admin() or (public.is_owner() and role in ('waiter', 'cook') and hotel_id = public.current_hotel_id()));

create policy menu_items_select on public.menu_items for select to authenticated
using (public.owns_hotel(hotel_id));
create policy menu_items_insert on public.menu_items for insert to authenticated
with check (public.is_owner() and hotel_id = public.current_hotel_id());
create policy menu_items_update on public.menu_items for update to authenticated
using (public.is_owner() and hotel_id = public.current_hotel_id())
with check (public.is_owner() and hotel_id = public.current_hotel_id());
create policy menu_items_delete on public.menu_items for delete to authenticated
using (public.is_owner() and hotel_id = public.current_hotel_id());

create policy table_configs_select on public.table_configs for select to authenticated
using (public.owns_hotel(hotel_id));
create policy table_configs_insert on public.table_configs for insert to authenticated
with check (public.is_owner() and hotel_id = public.current_hotel_id());
create policy table_configs_update on public.table_configs for update to authenticated
using (public.is_owner() and hotel_id = public.current_hotel_id())
with check (public.is_owner() and hotel_id = public.current_hotel_id());
create policy table_configs_delete on public.table_configs for delete to authenticated
using (public.is_owner() and hotel_id = public.current_hotel_id());

create policy orders_select on public.orders for select to authenticated
using (public.owns_hotel(hotel_id));
create policy orders_insert on public.orders for insert to authenticated
with check (public.owns_hotel(hotel_id));
create policy orders_update on public.orders for update to authenticated
using (public.owns_hotel(hotel_id))
with check (public.owns_hotel(hotel_id));
create policy orders_delete on public.orders for delete to authenticated
using (public.is_owner() and hotel_id = public.current_hotel_id());

create policy order_items_select on public.order_items for select to authenticated
using (exists (select 1 from public.orders where orders.id = order_items.order_id and public.owns_hotel(orders.hotel_id)));
create policy order_items_insert on public.order_items for insert to authenticated
with check (exists (select 1 from public.orders where orders.id = order_items.order_id and public.owns_hotel(orders.hotel_id)));
create policy order_items_update on public.order_items for update to authenticated
using (exists (select 1 from public.orders where orders.id = order_items.order_id and public.owns_hotel(orders.hotel_id)))
with check (exists (select 1 from public.orders where orders.id = order_items.order_id and public.owns_hotel(orders.hotel_id)));
create policy order_items_delete on public.order_items for delete to authenticated
using (exists (select 1 from public.orders where orders.id = order_items.order_id and public.is_owner() and orders.hotel_id = public.current_hotel_id()));