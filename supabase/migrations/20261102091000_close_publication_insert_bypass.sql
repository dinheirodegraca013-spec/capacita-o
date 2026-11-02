-- Close direct INSERT publication bypasses for courses and versions.
drop trigger if exists versions_require_aal2 on public.course_versions;
create trigger versions_require_aal2 before insert or update on public.course_versions for each row when (new.status = 'published') execute function public.require_aal2_publication();
drop trigger if exists courses_require_aal2 on public.courses;
create trigger courses_require_aal2 before insert or update on public.courses for each row when (new.status = 'published') execute function public.require_aal2_publication();
