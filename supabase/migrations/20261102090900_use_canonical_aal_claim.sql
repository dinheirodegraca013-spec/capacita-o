-- Read the canonical Supabase JWT claim, with local-test fallback.
create or replace function public.publish_offering(p_offering_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_offering public.offerings%rowtype; v_version public.course_versions%rowtype; v_owner_type text; v_aal text;
begin
  v_aal := coalesce(auth.jwt()->>'aal', nullif(current_setting('request.jwt.claim.aal', true), ''), 'aal1');
  if v_aal <> 'aal2' then raise exception 'MFA_REQUIRED'; end if;
  select * into v_offering from public.offerings where id = p_offering_id for update;
  if not found or not public.is_org_manager(v_offering.organization_id) then raise exception 'OFFERING_FORBIDDEN'; end if;
  select * into v_version from public.course_versions where id = v_offering.course_version_id;
  if not found then raise exception 'COURSE_VERSION_UNAVAILABLE'; end if;
  select c.owner_type into v_owner_type from public.courses c where c.id = v_version.course_id;
  if v_version.status <> 'published' then raise exception 'COURSE_VERSION_UNAVAILABLE'; end if;
  if v_owner_type = 'organization' then null;
  elsif v_owner_type = 'central' and not exists (select 1 from public.course_grants g where g.organization_id = v_offering.organization_id and g.course_version_id = v_offering.course_version_id and g.status = 'active') then raise exception 'COURSE_NOT_GRANTED'; end if;
  update public.offerings set status = 'published' where id = p_offering_id;
  return p_offering_id;
end; $$;
grant execute on function public.publish_offering(uuid) to authenticated;

create or replace function public.publish_course_version(p_version_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_course public.courses%rowtype; v_version public.course_versions%rowtype; v_lessons integer; v_aal text;
begin
  v_aal := coalesce(auth.jwt()->>'aal', nullif(current_setting('request.jwt.claim.aal', true), ''), 'aal1');
  if v_aal <> 'aal2' then raise exception 'MFA_REQUIRED'; end if;
  select v.* into v_version from public.course_versions v where v.id = p_version_id for update;
  if not found then raise exception 'COURSE_VERSION_NOT_FOUND'; end if;
  select c.* into v_course from public.courses c where c.id = v_version.course_id for update;
  if not found or v_course.owner_type <> 'organization' or not public.is_org_manager(v_course.organization_id) then raise exception 'COURSE_FORBIDDEN'; end if;
  if not v_version.license_confirmed then raise exception 'LICENSE_REQUIRED'; end if;
  select count(*) into v_lessons from public.course_lessons l join public.course_modules m on m.id = l.module_id where m.course_version_id = p_version_id;
  if v_lessons = 0 then raise exception 'EMPTY_CONTENT'; end if;
  update public.course_versions set status = 'published', published_at = coalesce(published_at, timezone('utc', now())) where id = p_version_id;
  if v_course.status <> 'published' then update public.courses set status = 'published' where id = v_course.id; end if;
  return p_version_id;
end; $$;
grant execute on function public.publish_course_version(uuid) to authenticated;
