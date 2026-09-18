create or replace function public.enforce_order_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() = 'cook' and (
    new.hotel_id is distinct from old.hotel_id or
    new.order_number is distinct from old.order_number or
    new.table_number is distinct from old.table_number or
    new.subtotal is distinct from old.subtotal or
    new.gst is distinct from old.gst or
    new.service is distinct from old.service or
    new.total_amount is distinct from old.total_amount or
    new.status is distinct from old.status or
    new.waiter_id is distinct from old.waiter_id or
    new.waiter_name is distinct from old.waiter_name or
    new.order_date is distinct from old.order_date
  ) then
    raise exception 'Cooks may update kitchen status only';
  end if;
  return new;
end;
$$;

create trigger orders_enforce_role_updates
before update on public.orders
for each row execute function public.enforce_order_update_permissions();