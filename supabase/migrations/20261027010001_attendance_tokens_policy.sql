create policy attendance_tokens_no_direct_access on public.attendance_tokens
  for all using (false) with check (false);
