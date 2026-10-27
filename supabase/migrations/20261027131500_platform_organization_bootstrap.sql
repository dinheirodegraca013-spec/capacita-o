create or replace function public.create_platform_organization(
  p_user_id uuid,
  p_name text,
  p_slug text,
  p_kind text,
  p_timezone text default 'America/Sao_Paulo'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_membership_id uuid;
begin
  if not exists (select 1 from public.platform_admins where user_id = p_user_id) then
    raise exception 'PLATFORM_ADMIN_REQUIRED';
  end if;
  insert into public.organizations(name, slug, kind, timezone)
  values (btrim(p_name), p_slug, p_kind, coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'))
  returning id into v_organization_id;
  insert into public.profiles(auth_user_id, display_name)
  values (p_user_id, split_part(coalesce(nullif(btrim(p_name), ''), 'CapacitaGov'), ' ', 1))
  on conflict (auth_user_id) do nothing;
  insert into public.memberships(user_id, organization_id, status)
  values (p_user_id, v_organization_id, 'active')
  returning id into v_membership_id;
  insert into public.membership_roles(membership_id, role)
  values (v_membership_id, 'manager');
  return v_organization_id;
end;
$$;

revoke all on function public.create_platform_organization(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_platform_organization(uuid, text, text, text, text) to service_role;