create or replace function public.publish_offering(p_offering_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_offering public.offerings%rowtype; v_version public.course_versions%rowtype; begin
  select * into v_offering from public.offerings where id = p_offering_id for update;
  if not found or not public.is_org_manager(v_offering.organization_id) then raise exception 'OFFERING_FORBIDDEN'; end if;
  select * into v_version from public.course_versions where id = v_offering.course_version_id;
  if not found or v_version.status <> 'published' then raise exception 'COURSE_VERSION_UNAVAILABLE'; end if;
  if not exists (select 1 from public.course_grants g where g.organization_id = v_offering.organization_id and g.course_version_id = v_offering.course_version_id and g.status = 'active') then raise exception 'COURSE_NOT_GRANTED'; end if;
  update public.offerings set status = 'published' where id = p_offering_id;
  return p_offering_id;
end; $$;
grant execute on function public.publish_offering(uuid) to authenticated;
