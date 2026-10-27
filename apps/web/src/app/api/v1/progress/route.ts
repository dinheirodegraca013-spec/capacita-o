import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { recordProgress } from '@/modules/learning/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; enrollmentId?: string; lessonId?: string; positionSeconds?: number; completed?: boolean; confirmedRead?: boolean } | null;
  if (!body?.organizationId || !body.enrollmentId || !body.lessonId || !Number.isInteger(body.positionSeconds) || typeof body.completed !== 'boolean') return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const positionSeconds = body.positionSeconds as number;
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { return NextResponse.json(await recordProgress({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, { enrollmentId: body.enrollmentId, lessonId: body.lessonId, positionSeconds, completed: body.completed, confirmedRead: body.confirmedRead }, supabase as never)); }
  catch (error) { const message = error instanceof Error ? error.message : 'Progress failed'; return NextResponse.json({ error: message }, { status: message.includes('FORBIDDEN') ? 403 : 422 }); }
}
