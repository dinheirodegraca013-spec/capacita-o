import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolveAppOrigin } from '@/modules/auth/redirect';
import { buildProviderHeaders, buildRecoveryEmail, buildRecoveryLink } from '@/modules/notifications/resend';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });

  const publicOrigin = resolveAppOrigin(process.env.NEXT_PUBLIC_APP_URL, request.nextUrl.origin, process.env.NODE_ENV);
  const genericResponse = NextResponse.json({ sent: true }, { status: 202 });
  const providerUrl = process.env.EMAIL_PROVIDER_URL;
  const providerKey = process.env.EMAIL_PROVIDER_KEY;
  const from = process.env.EMAIL_FROM;
  if (!providerUrl || !providerKey || !from) return genericResponse;

  try {
    const admin = createSupabaseAdminClient();
    const generated = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: publicOrigin + '/redefinir-senha' } });
    const properties = generated.data?.properties as { email_otp?: string; hashed_token?: string } | undefined;
    if (generated.error || (!properties?.email_otp && !properties?.hashed_token)) return genericResponse;
    const actionLink = properties.hashed_token
      ? publicOrigin + '/redefinir-senha?token_hash=' + encodeURIComponent(properties.hashed_token) + '&type=recovery'
      : buildRecoveryLink(publicOrigin, email, properties.email_otp!);
    await fetch(providerUrl, {
      method: 'POST',
      headers: buildProviderHeaders(providerKey, 'recovery:' + email + ':' + (properties.hashed_token ?? properties.email_otp)),
      body: JSON.stringify(buildRecoveryEmail({ from, to: email, actionLink })),
    });
  } catch {
    // Keep account existence and provider failures indistinguishable.
  }
  return genericResponse;
}
