-- Enforce AAL2 on direct publication mutations, not only RPC entrypoints.
create or replace function public.require_aal2_publication()
returns trigger language plpgsql set search_path = public as $$
declare v_aal text;
begin
  if current_user = 'authenticated' then
    v_aal := coalesce(auth.jwt()->>'aal', nullif(current_setting('request.jwt.claim.aal', true), ''), 'aal1');
    if v_aal <> 'aal2' then raise exception 'MFA_REQUIRED'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists offerings_require_aal2 on public.offerings;
create trigger offerings_require_aal2 before insert or update on public.offerings for each row when (new.status = 'published') execute function public.require_aal2_publication();
drop trigger if exists versions_require_aal2 on public.course_versions;
create trigger versions_require_aal2 before update on public.course_versions for each row when (new.status = 'published') execute function public.require_aal2_publication();

authorize;
