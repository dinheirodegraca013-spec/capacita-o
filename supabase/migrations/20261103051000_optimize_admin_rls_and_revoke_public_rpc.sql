revoke execute on function public.create_organization_for_platform_admin(text, text, text, text) from public, anon;
grant execute on function public.create_organization_for_platform_admin(text, text, text, text) to authenticated;

drop policy if exists organizations_select_member on public.organizations;
drop policy if exists organizations_select_platform_admin on public.organizations;
drop policy if exists organizations_select_scoped on public.organizations;
create policy organizations_select_scoped on public.organizations
  for select to authenticated
  using (
    public.is_active_member(id)
    or (
      (select public.is_platform_admin())
      and coalesce((select auth.jwt()->>'aal'), nullif((select current_setting('request.jwt.claim.aal', true)), ''), 'aal1') = 'aal2'
    )
  );

drop policy if exists audit_events_select_scoped on public.audit_events;
create policy audit_events_select_scoped on public.audit_events
  for select to authenticated
  using (
    public.is_active_member(organization_id)
    or (
      (select public.is_platform_admin())
      and coalesce((select auth.jwt()->>'aal'), nullif((select current_setting('request.jwt.claim.aal', true)), ''), 'aal1') = 'aal2'
    )
  );
