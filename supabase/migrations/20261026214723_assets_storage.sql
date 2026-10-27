create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  object_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 255),
  mime_type text not null,
  kind text not null check (kind in ('video', 'pdf', 'audio')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.assets enable row level security;
create policy assets_select_member on public.assets for select using (public.is_active_member(organization_id));
create policy assets_insert_manager on public.assets for insert with check (public.is_org_manager(organization_id));
revoke all on public.assets from anon, authenticated;
grant select, insert on public.assets to authenticated;

insert into storage.buckets (id, name, public) values ('course-assets', 'course-assets', false) on conflict (id) do update set public = false;
create policy course_assets_select_member on storage.objects for select using (bucket_id = 'course-assets' and public.is_active_member((storage.foldername(name))[1]::uuid));
create policy course_assets_insert_manager on storage.objects for insert with check (bucket_id = 'course-assets' and public.is_org_manager((storage.foldername(name))[1]::uuid));
