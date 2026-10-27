-- Reclaim processing rows created before processing_at was introduced.
create or replace function public.claim_pending_notifications(p_limit integer default 50)
returns setof public.notification_outbox language plpgsql security definer set search_path = public as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'NOTIFICATION_LIMIT_INVALID'; end if;
  return query with claimed as (
    select n.id from public.notification_outbox n
    where (n.status = 'pending' or (n.status = 'processing' and coalesce(n.processing_at, n.created_at) < timezone('utc', now()) - interval '15 minutes'))
      and n.attempts < 5 and n.next_attempt_at <= timezone('utc', now())
    order by n.next_attempt_at, n.created_at limit p_limit for update skip locked
  ) update public.notification_outbox n set status = 'processing', processing_at = timezone('utc', now()) from claimed where n.id = claimed.id returning n.*;
end; $$;

revoke all on function public.claim_pending_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_pending_notifications(integer) to service_role;

