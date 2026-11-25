import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const body = await request.json().catch(() => null) as { organizationId?: unknown } | null;
  if (typeof body?.organizationId !== 'string' || !body.organizationId.trim()) {
    return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  }
  const { data: membership } = await supabase
    .from('memberships')
    .select('id, membership_roles(role)')
    .eq('user_id', user.id)
    .eq('organization_id', body.organizationId)
    .eq('status', 'active')
    .maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: string }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const assessmentId = (await params).id;
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id')
    .eq('id', assessmentId)
    .eq('organization_id', body.organizationId)
    .maybeSingle();
  if (!assessment) return NextResponse.json({ error: 'ASSESSMENT_NOT_FOUND' }, { status: 404 });

  const { data, error } = await supabase.rpc('publish_assessment', { p_assessment_id: assessmentId });
  if (error) return NextResponse.json({ error: error.message }, { status: 422 });
  return NextResponse.json({ id: data });
}
