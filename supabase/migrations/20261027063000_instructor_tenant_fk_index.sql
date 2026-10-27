create index if not exists instructor_assignments_class_tenant_idx
  on public.instructor_assignments (class_group_id, organization_id);
