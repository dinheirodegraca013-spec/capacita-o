import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/modules/auth/redirect';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const tokenType = request.nextUrl.searchParams.get('type');
  const next = safeRedirectPath(request.nextUrl.searchParams.get('next'));
  if (!code && !(tokenHash && ['invite', 'magiclink', 'recovery'].includes(tokenType ?? ''))) {
    return NextResponse.redirect(new URL('/login?error=callback', request.url));
  }
  const supabase = await createSupabaseServerClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: tokenType as 'invite' | 'magiclink' | 'recovery' });
  return NextResponse.redirect(new URL(error ? '/login?error=callback' : next, request.url));
}

