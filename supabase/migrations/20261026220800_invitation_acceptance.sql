create or replace function public.accept_invitation(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_invitation public.invitations%rowtype; v_email text; v_membership uuid; v_role text;
begin
  if auth.uid() is null or p_token is null or btrim(p_token) = '' then raise exception 'INVITATION_INVALID'; end if;
  v_email := lower(coalesce(current_setting('request.jwt.claim.email', true), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')));
  select * into v_invitation from public.invitations where token_hash = encode(digest(p_token, 'sha256'), 'hex') and status in ('pending', 'sent') and expires_at > now() for update;
  if not found or lower(v_invitation.email) <> lower(coalesce(v_email, '')) then raise exception 'INVITATION_INVALID'; end if;
  insert into public.profiles(auth_user_id, display_name) values (auth.uid(), split_part(v_email, '@', 1)) on conflict (auth_user_id) do nothing;
  insert into public.memberships(user_id, organization_id, status) values (auth.uid(), v_invitation.organization_id, 'active') on conflict (user_id, organization_id) do update set status = 'active' returning id into v_membership;
  foreach v_role in array v_invitation.roles loop insert into public.membership_roles(membership_id, role) values (v_membership, v_role) on conflict do nothing; end loop;
  update public.invitations set status = 'accepted', accepted_at = timezone('utc', now()) where id = v_invitation.id;
  return v_invitation.organization_id;
end; $$;
revoke all on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
