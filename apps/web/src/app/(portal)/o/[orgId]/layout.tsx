import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OrganizationRole } from '@/modules/identity/model';
import { PortalShell } from '@/components/layout/portal-shell';

export const dynamic = 'force-dynamic';

export default async function OrganizationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('memberships').select('membership_roles(role), organizations(name)').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle();
  if (!membership) notFound();
  const roles = ((membership.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  const organizationName = (membership.organizations as { name?: string } | null)?.name ?? 'Organização';
  return <PortalShell organizationName={organizationName} organizationId={orgId} roles={roles}>{children}</PortalShell>;
}
