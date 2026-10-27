-- Enforce tenant ownership on relationship rows at the database boundary.

do $$ begin
  alter table public.offerings add constraint offerings_id_organization_key unique (id, organization_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.memberships add constraint memberships_id_organization_key unique (id, organization_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.class_groups add constraint class_groups_id_organization_key unique (id, organization_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.class_groups
    add constraint class_groups_offering_tenant_fkey
    foreign key (offering_id, organization_id)
    references public.offerings (id, organization_id)
    on delete restrict;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.instructor_assignments
    add constraint instructor_assignments_class_tenant_fkey
    foreign key (class_group_id, organization_id)
    references public.class_groups (id, organization_id)
    on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.instructor_assignments
    add constraint instructor_assignments_membership_tenant_fkey
    foreign key (membership_id, organization_id)
    references public.memberships (id, organization_id)
    on delete restrict;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.meetings
    add constraint meetings_class_tenant_fkey
    foreign key (class_group_id, organization_id)
    references public.class_groups (id, organization_id)
    on delete cascade;
exception when duplicate_object then null; end $$;

create index if not exists class_groups_offering_tenant_idx on public.class_groups (offering_id, organization_id);
create index if not exists instructor_assignments_membership_tenant_idx on public.instructor_assignments (membership_id, organization_id);
create index if not exists meetings_class_tenant_idx on public.meetings (class_group_id, organization_id);

create or replace function public.confirm_attendance(p_meeting_id uuid, p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_meeting public.meetings%rowtype; v_enrollment public.enrollments%rowtype; v_id uuid;
begin
  if p_token is null or btrim(p_token) = '' then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  select * into v_meeting from public.meetings where id = p_meeting_id and status <> 'cancelled';
  if not found then raise exception 'MEETING_INVALID'; end if;
  if not exists (select 1 from public.attendance_tokens t where t.meeting_id = p_meeting_id and t.token_hash = encode(digest(p_token, 'sha256'), 'hex') and t.expires_at > now()) then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  if now() < v_meeting.starts_at or now() > v_meeting.ends_at then raise exception 'MEETING_WINDOW_INVALID'; end if;
  select e.* into v_enrollment
    from public.enrollments e
    join public.memberships m on m.id = e.membership_id and m.organization_id = e.organization_id
   where e.class_group_id = v_meeting.class_group_id
     and e.organization_id = v_meeting.organization_id
     and e.status = 'active'
     and m.user_id = auth.uid()
     and m.status = 'active';
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  insert into public.attendance_records (organization_id, meeting_id, enrollment_id)
  values (v_enrollment.organization_id, p_meeting_id, v_enrollment.id)
  on conflict (meeting_id, enrollment_id) do update set marked_at = public.attendance_records.marked_at
  returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.confirm_attendance(uuid, text) from anon;
grant execute on function public.confirm_attendance(uuid, text) to authenticated;

