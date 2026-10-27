create or replace function public.verify_certificate(p_code text) returns jsonb language sql stable security definer set search_path = public as $$
  select case when c.id is null then null else jsonb_build_object('code', c.public_code, 'holderName', c.holder_name_snapshot, 'courseTitle', c.course_title_snapshot, 'organizationName', c.organization_name_snapshot, 'workloadHours', c.workload_hours, 'issuedAt', c.issued_at, 'status', c.status) end from (select * from public.certificates where public_code = p_code limit 1) c;
$$;
create or replace function public.revoke_certificate(p_certificate_id uuid, p_reason text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; begin
  if p_reason is null or length(btrim(p_reason)) < 3 then raise exception 'REVOCATION_REASON_REQUIRED'; end if;
  select organization_id into v_org from public.certificates where id = p_certificate_id for update;
  if v_org is null or not public.is_org_manager(v_org, nullif(current_setting('request.jwt.claim.sub', true), '')::uuid) then raise exception 'CERTIFICATE_FORBIDDEN'; end if;
  update public.certificates set status = 'revoked', revoked_at = now(), revocation_reason = btrim(p_reason) where id = p_certificate_id;
  return p_certificate_id;
end; $$;
revoke all on function public.verify_certificate(text) from public;
revoke all on function public.revoke_certificate(uuid, text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
grant execute on function public.revoke_certificate(uuid, text) to authenticated;
