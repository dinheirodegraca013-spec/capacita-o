grant execute on function public.assessment_org(uuid) to authenticated;
grant execute on function public.can_access_course_metadata(uuid, uuid) to authenticated;
grant execute on function public.can_access_course_version(uuid, uuid) to authenticated;
grant execute on function public.is_active_member(uuid, uuid) to authenticated;
grant execute on function public.is_org_manager(uuid, uuid) to authenticated;
grant execute on function public.is_platform_admin(uuid) to authenticated;
