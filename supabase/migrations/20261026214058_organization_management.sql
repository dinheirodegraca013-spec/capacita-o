create or replace function public.is_org_manager(target_organization uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    join public.membership_roles mr on mr.membership_id = m.id and mr.role = 'manager'
    where m.organization_id = target_organization and m.user_id = coalesce(target_user, auth.uid()) and m.status = 'active'
  );
$$;

create policy organizations_update_manager on public.organizations for update using (public.is_org_manager(id)) with check (public.is_org_manager(id));
create policy org_units_insert_manager on public.org_units for insert with check (public.is_org_manager(organization_id));
create policy org_units_update_manager on public.org_units for update using (public.is_org_manager(organization_id)) with check (public.is_org_manager(organization_id));
create policy org_units_delete_manager on public.org_units for delete using (public.is_org_manager(organization_id));
grant insert, update, delete on public.org_units to authenticated;
grant update on public.organizations to authenticated;
