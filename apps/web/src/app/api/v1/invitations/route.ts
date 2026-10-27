import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildInvitationRedirect, inviteMember } from '@/modules/invitations/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; email?: string; roles?: OrganizationRole[] } | null;
  if (!body?.organizationId || !body.email || !body.roles?.length) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const membershipRoles = (membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>;
  const roles = membershipRoles.map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const admin = createSupabaseAdminClient();
    const invitation = await inviteMember({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, { email: body.email, roles: body.roles }, admin as never);
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(invitation.email, { redirectTo: buildInvitationRedirect(request.nextUrl.origin, invitation.rawToken ?? '') });
    if (inviteError) return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });
    return NextResponse.json({ invitation: { id: invitation.id, email: invitation.email, roles: invitation.roles, status: invitation.status, expiresAt: invitation.expiresAt } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invitation failed';
    return NextResponse.json({ error: message.includes('already pending') ? 'CONFLICT' : 'VALIDATION' }, { status: message.includes('already pending') ? 409 : 422 });
  }
}

