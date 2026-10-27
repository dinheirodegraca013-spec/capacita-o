import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { saveAnswer } from '@/modules/assessments/attempts';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; questionId?: string; optionId?: string } | null; if (!body?.organizationId || !body.questionId || !body.optionId) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle(); const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role); if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { return NextResponse.json({ id: await saveAnswer({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, id, body.questionId, body.optionId, supabase as never) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Answer failed' }, { status: 422 }); }
}
