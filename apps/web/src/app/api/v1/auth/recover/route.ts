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
    const generated = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: `${publicOrigin}/redefinir-senha` } });
    const emailOtp = (generated.data?.properties as { email_otp?: string } | undefined)?.email_otp;
    if (generated.error || !emailOtp) return genericResponse;
    const actionLink = buildRecoveryLink(publicOrigin, email, emailOtp);
    await fetch(providerUrl, {
      method: 'POST',
      headers: buildProviderHeaders(providerKey, `recovery:${email}`),
      body: JSON.stringify(buildRecoveryEmail({ from, to: email, actionLink })),
    });
  } catch {
    // Keep account existence and provider failures indistinguishable.
  }
  return genericResponse;
}

