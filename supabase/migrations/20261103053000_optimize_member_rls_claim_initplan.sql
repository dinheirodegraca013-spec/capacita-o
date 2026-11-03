begin;

drop policy if exists organizations_select_scoped on public.organizations;
create policy organizations_select_scoped
  on public.organizations
  for select
  to authenticated
  using (
    (select is_active_member(id, (select auth.uid())))
    or (
      (select is_platform_admin((select auth.uid())))
      and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

drop policy if exists audit_events_select_scoped on public.audit_events;
create policy audit_events_select_scoped
  on public.audit_events
  for select
  to authenticated
  using (
    (select is_active_member(organization_id, (select auth.uid())))
    or (
      (select is_platform_admin((select auth.uid())))
      and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

commit;
