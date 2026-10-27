-- The catalog authorization helper is for RLS evaluation, not anonymous RPC use.
revoke all on function public.can_access_course_version(uuid, uuid) from public, anon;
grant execute on function public.can_access_course_version(uuid, uuid) to authenticated;
