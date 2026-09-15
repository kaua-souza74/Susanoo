revoke delete, truncate, references, trigger, maintain
on table public.payment_orders
from service_role;

grant select, insert, update
on table public.payment_orders
to service_role;
