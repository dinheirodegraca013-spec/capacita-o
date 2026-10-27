import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildInvitationRedirect, inviteMember } from '@/modules/invitations/service';
import { buildInvitationEmail } from '@/modules/notifications/resend';
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
    // Use the canonical public origin so links generated behind a preview/proxy
    // never point to an unreachable host or an unallowlisted Supabase redirect.
    const publicOrigin = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
    const redirectTo = buildInvitationRedirect(publicOrigin, invitation.rawToken ?? '');
    const providerUrl = process.env.EMAIL_PROVIDER_URL;
    const providerKey = process.env.EMAIL_PROVIDER_KEY;
    const from = process.env.EMAIL_FROM;
    if (!providerUrl || !providerKey || !from) return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });

    // Generate the Supabase action link but deliver it through the configured
    // transactional provider. Relying on Supabase's built-in mailer here can
    // silently leave the invitation without a usable button when Auth SMTP is
    // not configured or is rate-limited.
    let generated = await admin.auth.admin.generateLink({ type: 'invite', email: invitation.email, options: { redirectTo } });
    if (generated.error && /already|registered|exists/i.test(generated.error.message)) {
      generated = await admin.auth.admin.generateLink({ type: 'magiclink', email: invitation.email, options: { redirectTo } });
    }
    if (generated.error || !generated.data?.properties.action_link) {
      await admin.from('invitations').update({ status: 'failed' }).eq('id', invitation.id);
      return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });
    }
    const response = await fetch(providerUrl, { method: 'POST', headers: { authorization: `Bearer ${providerKey}`, 'content-type': 'application/json' }, body: JSON.stringify(buildInvitationEmail({ from, to: invitation.email, actionLink: generated.data.properties.action_link })) });
    if (!response.ok) {
      await admin.from('invitations').update({ status: 'failed' }).eq('id', invitation.id);
      return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });
    }
    const { error: statusError } = await admin.from('invitations').update({ status: 'sent', last_sent_at: new Date().toISOString() }).eq('id', invitation.id);
    if (statusError) return NextResponse.json({ error: 'INVITE_STATUS_FAILED' }, { status: 503 });
    return NextResponse.json({ invitation: { id: invitation.id, email: invitation.email, roles: invitation.roles, status: invitation.status, expiresAt: invitation.expiresAt } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invitation failed';
    return NextResponse.json({ error: message.includes('already pending') ? 'CONFLICT' : 'VALIDATION' }, { status: message.includes('already pending') ? 409 : 422 });
  }
}

