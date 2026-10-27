import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OfferingManagementForm } from '@/components/catalog/offering-management-form';
export const dynamic = 'force-dynamic';
export default async function CatalogManagementPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: centralVersions }, { data: ownVersions }, { data: offerings }] = await Promise.all([
    supabase.from('course_versions').select('id, title, course_grants!inner(organization_id)').eq('course_grants.organization_id', orgId).eq('status', 'published').order('created_at', { ascending: false }),
    supabase.from('course_versions').select('id, title, courses!inner(owner_type, organization_id)').eq('courses.owner_type', 'organization').eq('courses.organization_id', orgId).eq('status', 'published').order('created_at', { ascending: false }),
    supabase.from('offerings').select('id, title, status').eq('organization_id', orgId).order('created_at', { ascending: false }),
  ]);
  const versions = [...(centralVersions ?? []), ...(ownVersions ?? [])].filter((version, index, list) => list.findIndex((item) => item.id === version.id) === index);

  return <section className="stack"><h1>Catálogo institucional</h1>{versions.length ? <div className="stack">{versions.map((version) => <OfferingManagementForm key={version.id} organizationId={orgId} courseVersionId={version.id} courseTitle={version.title} />)}</div> : <p className="empty-state">Nenhum curso publicado/concedido disponível.</p>}<ul>{(offerings ?? []).map((offering) => <li key={offering.id}>{offering.title} — {offering.status}</li>)}</ul></section>;
}

