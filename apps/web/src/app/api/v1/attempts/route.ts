import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { startAttempt } from '@/modules/assessments/attempts';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; enrollmentId?: string; assessmentId?: string } | null;
  if (!body?.organizationId || !body.enrollmentId || !body.assessmentId) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role); if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { return NextResponse.json({ id: await startAttempt({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, body.enrollmentId, body.assessmentId, supabase as never) }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Attempt failed' }, { status: 422 }); }
}
