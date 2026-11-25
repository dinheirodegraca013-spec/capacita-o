create policy organizations_select_scoped
  on public.organizations
  for select
  to authenticated
  using (
    public.is_active_member(id)
    or (
      (select public.is_platform_admin())
      and coalesce((select auth.jwt()->>'aal'), nullif((select current_setting('request.jwt.claim.aal', true)), ''), 'aal1') = 'aal2'
    )
  );

create or replace function public.create_organization_for_platform_admin(
  p_name text,
  p_slug text,
  p_kind text,
  p_timezone text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_aal text;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception 'ORGANIZATION_FORBIDDEN';
  end if;
  v_aal := coalesce(auth.jwt()->>'aal', nullif(current_setting('request.jwt.claim.aal', true), ''), 'aal1');
  if v_aal <> 'aal2' then raise exception 'MFA_REQUIRED'; end if;
  if p_name is null or length(trim(p_name)) = 0 or length(p_name) > 180 then raise exception 'ORGANIZATION_INVALID'; end if;
  if p_kind not in ('company', 'municipality', 'public_agency', 'nonprofit', 'other') then raise exception 'ORGANIZATION_INVALID'; end if;

  insert into public.organizations (name, slug, kind, timezone)
  values (trim(p_name), p_slug, p_kind, coalesce(nullif(trim(p_timezone), ''), 'America/Sao_Paulo'))
  returning id into v_id;

  insert into public.audit_events (organization_id, actor_user_id, action, resource_type, resource_id, outcome, metadata)
  values (v_id, auth.uid(), 'organization.create', 'organization', v_id, 'success', jsonb_build_object('slug', p_slug, 'kind', p_kind));
  return v_id;
end;
$function$;

revoke execute on function public.create_organization_for_platform_admin(text, text, text, text) from public, anon;
grant execute on function public.create_organization_for_platform_admin(text, text, text, text) to authenticated;
