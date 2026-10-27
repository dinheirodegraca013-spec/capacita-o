import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildInvitationRedirect, canResendInvitation, resolveInvitationOrigin } from '@/modules/invitations/service';
import { buildInvitationEmail, buildProviderHeaders } from '@/modules/notifications/resend';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; invitationId?: string } | null;
  if (!body?.organizationId || !body.invitationId) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: invitation, error: lookupError } = await admin.from('invitations').select('id, organization_id, email, roles, status, expires_at, last_sent_at').eq('id', body.invitationId).eq('organization_id', body.organizationId).maybeSingle();
  if (lookupError || !invitation) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!['pending', 'sent', 'failed'].includes(invitation.status)) return NextResponse.json({ error: 'INVITATION_NOT_RESENDABLE' }, { status: 422 });
  if (invitation.status !== 'failed' && !canResendInvitation(invitation.last_sent_at ? new Date(invitation.last_sent_at) : null)) {
    const retryAfter = Math.max(1, Math.ceil((new Date(invitation.last_sent_at).getTime() + 15 * 60_000 - Date.now()) / 1000));
    return NextResponse.json({ error: 'RATE_LIMITED', retryAfterSeconds: retryAfter }, { status: 429, headers: { 'retry-after': String(retryAfter) } });
  }

  const providerUrl = process.env.EMAIL_PROVIDER_URL;
  const providerKey = process.env.EMAIL_PROVIDER_KEY;
  const from = process.env.EMAIL_FROM;
  if (!providerUrl || !providerKey || !from) return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });
  const rawToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const sentAt = new Date().toISOString();
  let claim = admin.from('invitations').update({ token_hash: createHash('sha256').update(rawToken).digest('hex'), expires_at: expiresAt, status: 'pending', last_sent_at: sentAt }).eq('id', invitation.id).eq('organization_id', body.organizationId);
  claim = invitation.last_sent_at ? claim.eq('last_sent_at', invitation.last_sent_at) : claim.is('last_sent_at', null);
  const { data: claimed, error: rotateError } = await claim.select('id');
  if (rotateError) return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });
  if (!claimed?.length) return NextResponse.json({ error: 'RATE_LIMITED', retryAfterSeconds: 900 }, { status: 429, headers: { 'retry-after': '900' } });

  const publicOrigin = resolveInvitationOrigin(process.env.NEXT_PUBLIC_APP_URL, request.nextUrl.origin, process.env.NODE_ENV);
  const redirectTo = buildInvitationRedirect(publicOrigin, rawToken);
  let generated = await admin.auth.admin.generateLink({ type: 'invite', email: invitation.email, options: { redirectTo } });
  if (generated.error && /already|registered|exists/i.test(generated.error.message)) generated = await admin.auth.admin.generateLink({ type: 'magiclink', email: invitation.email, options: { redirectTo } });
  if (generated.error || !generated.data?.properties.action_link) {
    await admin.from('invitations').update({ status: 'failed' }).eq('id', invitation.id);
    return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });
  }
  const response = await fetch(providerUrl, { method: 'POST', headers: buildProviderHeaders(providerKey, `invitation:${invitation.id}:${sentAt}`), body: JSON.stringify(buildInvitationEmail({ from, to: invitation.email, actionLink: generated.data.properties.action_link })) });
  if (!response.ok) {
    await admin.from('invitations').update({ status: 'failed' }).eq('id', invitation.id);
    return NextResponse.json({ error: 'INVITE_DELIVERY_FAILED' }, { status: 503 });
  }
  const { error: sentError } = await admin.from('invitations').update({ status: 'sent', last_sent_at: new Date().toISOString() }).eq('id', invitation.id);
  if (sentError) return NextResponse.json({ error: 'INVITE_STATUS_FAILED' }, { status: 503 });
  return NextResponse.json({ invitation: { id: invitation.id, email: invitation.email, roles: invitation.roles, status: 'sent', expiresAt } });
}

