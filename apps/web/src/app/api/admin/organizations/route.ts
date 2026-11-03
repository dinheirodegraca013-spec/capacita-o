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
  if (!name || name.length > 180 || !['company','municipality','public_agency','nonprofit','other'].includes(kind)) {
    return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  }

  const slug = slugify(name);
  const { data: organizationId, error } = await supabase.rpc('create_organization_for_platform_admin', {
    p_name: name,
    p_slug: slug,
    p_kind: kind,
    p_timezone: timezone,
  });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'SLUG_EXISTS' }, { status: 409 });
    if (error.message.includes('MFA_REQUIRED')) return NextResponse.json({ error: 'MFA_REQUIRED' }, { status: 403 });
    if (error.message.includes('ORGANIZATION_FORBIDDEN')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    return NextResponse.json({ error: 'UNAVAILABLE' }, { status: 503 });
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id,name,slug,kind,timezone')
    .eq('id', organizationId)
    .maybeSingle();
  return NextResponse.json({ organization }, { status: 201 });
}
