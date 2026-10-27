-- Enforce organization consistency across class, offering and meeting references.

create or replace function public.validate_class_group_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.offerings where id = new.offering_id;
  if v_org is null or v_org <> new.organization_id then raise exception 'CLASS_SCOPE_INVALID'; end if;
  return new;
end; $$;
drop trigger if exists class_group_scope on public.class_groups;
create trigger class_group_scope before insert or update on public.class_groups for each row execute function public.validate_class_group_scope();

create or replace function public.validate_meeting_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.class_groups where id = new.class_group_id;
  if v_org is null or v_org <> new.organization_id then raise exception 'MEETING_SCOPE_INVALID'; end if;
  return new;
end; $$;
drop trigger if exists meetings_scope on public.meetings;
create trigger meetings_scope before insert or update on public.meetings for each row execute function public.validate_meeting_scope();

grant execute on function public.validate_class_group_scope(), public.validate_meeting_scope() to authenticated;
