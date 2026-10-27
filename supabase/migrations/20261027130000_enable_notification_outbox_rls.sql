-- The outbox is service-owned. Keep RLS enabled even though direct table
-- grants are revoked, so a future grant cannot accidentally expose queue data.
alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from public, anon, authenticated;

