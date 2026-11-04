-- This helper is an internal RLS primitive, not a public RPC endpoint.
revoke execute on function public.can_access_course_metadata(uuid, uuid) from public, anon;
grant execute on function public.can_access_course_metadata(uuid, uuid) to authenticated;

