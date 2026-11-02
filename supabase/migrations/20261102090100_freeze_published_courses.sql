-- Published course versions and content require a new version for changes.
create or replace function public.prevent_published_version_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'published' then
    raise exception using errcode = '55000', message = 'published course versions are immutable';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_published_course_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'published' then
    raise exception using errcode = '55000', message = 'published courses are immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists courses_immutable on public.courses;
create trigger courses_immutable before update on public.courses for each row execute function public.prevent_published_course_mutation();

create or replace function public.prevent_published_course_content_mutation()
returns trigger language plpgsql set search_path = public as $$
declare v_status text;
begin
  select v.status into v_status
  from public.course_versions v
  join public.course_modules m on m.course_version_id = v.id
  where m.id = case when tg_table_name = 'course_modules' then coalesce(new.id, old.id) else (select module_id from public.course_lessons where id = coalesce(new.id, old.id)) end;
  if v_status = 'published' then
    raise exception using errcode = '55000', message = 'published course content is immutable';
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists course_modules_immutable on public.course_modules;
create trigger course_modules_immutable before insert or update or delete on public.course_modules for each row execute function public.prevent_published_course_content_mutation();
drop trigger if exists course_lessons_immutable on public.course_lessons;
create trigger course_lessons_immutable before insert or update or delete on public.course_lessons for each row execute function public.prevent_published_course_content_mutation();
