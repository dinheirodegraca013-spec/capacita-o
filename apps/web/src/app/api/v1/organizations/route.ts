import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildOrganizationSlug, normalizeOrganizationInput } from '@/modules/organizations/service';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { data: platformAdmin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!platformAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const body = await request.json().catch(() => null) as { name?: string; slug?: string; kind?: string; timezone?: string } | null;
  if (!body?.name || !body.kind || !body.timezone) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  let input;
  try {
    const proposedSlug = body.slug?.trim() || buildOrganizationSlug(body.name);
    input = normalizeOrganizationInput({ name: body.name, slug: proposedSlug, kind: body.kind as 'company' | 'municipality' | 'public_agency' | 'nonprofit' | 'other', timezone: body.timezone });
  } catch {
    return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  }
  const admin = createSupabaseAdminClient();
  const { data: organizationId, error } = await admin.rpc('create_platform_organization', {
    p_user_id: user.id,
    p_name: input.name,
    p_slug: input.slug,
    p_kind: input.kind,
    p_timezone: input.timezone,
  });
  if (error) {
    if (error.message.includes('duplicate key')) return NextResponse.json({ error: 'CONFLICT' }, { status: 409 });
    if (error.message.includes('PLATFORM_ADMIN_REQUIRED')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    return NextResponse.json({ error: 'UNAVAILABLE' }, { status: 503 });
  }
  return NextResponse.json({ organizationId }, { status: 201 });
}
