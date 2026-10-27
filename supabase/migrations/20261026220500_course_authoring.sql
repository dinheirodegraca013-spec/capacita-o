create policy modules_insert_manager on public.course_modules for insert with check (exists (select 1 from public.course_versions v join public.courses c on c.id = v.course_id where v.id = course_version_id and v.status = 'draft' and c.owner_type = 'organization' and public.is_org_manager(c.organization_id)));
create policy lessons_insert_manager on public.course_lessons for insert with check (exists (select 1 from public.course_modules m join public.course_versions v on v.id = m.course_version_id join public.courses c on c.id = v.course_id where m.id = module_id and v.status = 'draft' and c.owner_type = 'organization' and public.is_org_manager(c.organization_id)));
create policy modules_update_manager on public.course_modules for update using (exists (select 1 from public.course_versions v join public.courses c on c.id = v.course_id where v.id = course_version_id and v.status = 'draft' and c.owner_type = 'organization' and public.is_org_manager(c.organization_id)));
create policy lessons_update_manager on public.course_lessons for update using (exists (select 1 from public.course_modules m join public.course_versions v on v.id = m.course_version_id join public.courses c on c.id = v.course_id where m.id = module_id and v.status = 'draft' and c.owner_type = 'organization' and public.is_org_manager(c.organization_id)));
grant insert, update on public.course_modules, public.course_lessons to authenticated;

create or replace function public.publish_course_version(p_version_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_course public.courses%rowtype; v_version public.course_versions%rowtype; v_lessons integer; begin
  select v.* into v_version from public.course_versions v where v.id = p_version_id for update;
  if not found then raise exception 'COURSE_VERSION_NOT_FOUND'; end if;
  select c.* into v_course from public.courses c where c.id = v_version.course_id for update;
  if not found or v_course.owner_type <> 'organization' or not public.is_org_manager(v_course.organization_id) then raise exception 'COURSE_FORBIDDEN'; end if;
  if not v_version.license_confirmed then raise exception 'LICENSE_REQUIRED'; end if;
  select count(*) into v_lessons from public.course_lessons l join public.course_modules m on m.id = l.module_id where m.course_version_id = p_version_id;
  if v_lessons = 0 then raise exception 'EMPTY_CONTENT'; end if;
  update public.course_versions set status = 'published', published_at = coalesce(published_at, timezone('utc', now())) where id = p_version_id;
  update public.courses set status = 'published' where id = v_course.id;
  return p_version_id;
end; $$;
grant execute on function public.publish_course_version(uuid) to authenticated;
