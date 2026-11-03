revoke execute on function public.assessment_org(uuid) from anon, authenticated;
revoke execute on function public.can_access_course_metadata(uuid, uuid) from anon, authenticated;
revoke execute on function public.can_access_course_version(uuid, uuid) from anon, authenticated;
revoke execute on function public.is_active_member(uuid, uuid) from anon, authenticated;
revoke execute on function public.is_org_manager(uuid, uuid) from anon, authenticated;
revoke execute on function public.is_platform_admin(uuid) from anon, authenticated;
