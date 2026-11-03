create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

begin;

select plan(10);

select ok(
  to_regclass('public.audit_events') is not null,
  'audit_events existe'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_events'
      and policyname = 'audit_events_select_scoped'
      and qual like '%is_active_member%'
      and qual like '%is_platform_admin%'
  ),
  'audit_events possui RLS para membro ativo ou superadmin'
);

select ok(
  not exists (
    select 1
    from information_schema.routine_privileges
    where specific_schema = 'public'
      and routine_name in (
        'assessment_org',
        'can_access_course_metadata',
        'can_access_course_version',
        'is_active_member',
        'is_org_manager',
        'is_platform_admin'
      )
      and grantee = 'anon'
      and privilege_type = 'EXECUTE'
  ),
  'helpers internos não são RPCs anônimos'
);

select ok(
  (select count(*) from information_schema.routine_privileges
   where specific_schema = 'public'
     and routine_name in (
       'assessment_org',
       'can_access_course_metadata',
       'can_access_course_version',
       'is_active_member',
       'is_org_manager',
       'is_platform_admin'
     )
     and grantee = 'authenticated'
     and privilege_type = 'EXECUTE') = 6,
  'helpers permanecem executáveis pelo RLS autenticado'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'record_lesson_progress'
      and position('COMPLETION_CONFIRMATION_REQUIRED' in pg_get_functiondef(p.oid)) > 0
  ),
  'record_lesson_progress exige confirmação ou duração integral'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'complete_enrollment'
      and position('COMPLETION_INELIGIBLE' in pg_get_functiondef(p.oid)) > 0
  ),
  'complete_enrollment bloqueia conclusão inelegível'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'verify_certificate'
  ),
  'verificação pública de certificado permanece disponível'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations'
      and policyname = 'organizations_select_platform_admin'
      and qual like '%is_platform_admin%'
      and qual like '%aal2%'
  ),
  'superadmin pode listar organizações via policy dedicada com MFA'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations'
      and policyname = 'organizations_insert_platform_admin'
  ),
  'INSERT direto de organização permanece bloqueado'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_organization_for_platform_admin'
      and position('MFA_REQUIRED' in pg_get_functiondef(p.oid)) > 0
      and position('organization_id' in pg_get_functiondef(p.oid)) > 0
  ),
  'RPC de organização exige MFA e tenant no audit'
);

select * from finish();
rollback;
