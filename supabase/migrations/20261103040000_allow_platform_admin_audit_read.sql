create policy audit_events_select_platform_admin on public.audit_events for select to authenticated using (public.is_platform_admin());
