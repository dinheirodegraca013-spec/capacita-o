drop policy if exists audit_events_select_member on public.audit_events;
drop policy if exists audit_events_select_platform_admin on public.audit_events;
drop policy if exists audit_events_select_scoped on public.audit_events;
create policy audit_events_select_scoped on public.audit_events for select to authenticated using (public.is_active_member(organization_id) or ((select public.is_platform_admin()) and coalesce((select auth.jwt()->>'aal'), nullif((select current_setting('request.jwt.claim.aal', true)), ''), 'aal1') = 'aal2'));
