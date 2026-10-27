import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ImportPeopleForm } from '@/components/people/import-people-form';

export const dynamic = 'force-dynamic';

export default async function OrganizationManagementPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: organization } = await supabase.from('organizations').select('id, name, slug, kind, timezone').eq('id', orgId).maybeSingle();
  if (!organization) notFound();
  return <main className="stack"><h1>Gestão da organização</h1><p>{organization.name}</p><dl><dt>Tipo</dt><dd>{organization.kind}</dd><dt>Fuso horário</dt><dd>{organization.timezone}</dd></dl><ImportPeopleForm organizationId={orgId} /></main>;
}
