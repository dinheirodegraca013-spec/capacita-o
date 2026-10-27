import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ImportPeopleForm } from '@/components/people/import-people-form';
import { InviteMemberForm } from '@/components/people/invite-member-form';
import { PendingInvitations } from '@/components/people/pending-invitations';
import { OrganizationSettingsForm } from '@/components/organizations/organization-settings-form';

export const dynamic = 'force-dynamic';

export default async function OrganizationManagementPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: organization } = await supabase.from('organizations').select('id, name, slug, kind, timezone').eq('id', orgId).maybeSingle();
  if (!organization) notFound();
  const { data: units } = await supabase.from('org_units').select('id, name').eq('organization_id', orgId).order('name');
  return <main className="stack"><h1>Gestão da organização</h1><p>{organization.name}</p><OrganizationSettingsForm organization={organization} units={units ?? []} /><InviteMemberForm organizationId={orgId} /><PendingInvitations organizationId={orgId} /><ImportPeopleForm organizationId={orgId} /></main>;
}

