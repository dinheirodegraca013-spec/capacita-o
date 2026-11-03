import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { data: admin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') return NextResponse.json({ error: 'MFA_REQUIRED' }, { status: 403 });
  const body = await request.json().catch(() => null) as { name?: string; kind?: string; timezone?: string } | null;
  const name = body?.name?.trim() ?? '';
  const kind = body?.kind ?? 'other';
  const timezone = body?.timezone?.trim() ?? 'America/Sao_Paulo';
  if (!name || name.length > 180 || !['company','municipality','public_agency','nonprofit','other'].includes(kind)) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data, error } = await supabase.from('organizations').insert({ name, slug: slugify(name), kind, timezone }).select('id,name,slug,kind,timezone').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'SLUG_EXISTS' : 'UNAVAILABLE' }, { status: error.code === '23505' ? 409 : 503 });
  return NextResponse.json({ organization: data }, { status: 201 });
}
