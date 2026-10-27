-- Scope validators run only as table triggers and must not be exposed as RPCs.
revoke all on function public.validate_class_group_scope(), public.validate_meeting_scope(), public.validate_instructor_assignment() from public, anon, authenticated;
