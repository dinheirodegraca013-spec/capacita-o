import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assignPath } from '@/modules/paths/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; membershipIds?: string[]; dueAt?: string | null } | null;
  if (!body?.organizationId || !Array.isArray(body.membershipIds)) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const result = await assignPath({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, { pathId: (await params).id, memberIds: body.membershipIds, dueAt: body.dueAt }, supabase as never);
    return NextResponse.json({ assigned: result.length }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'PATH_ASSIGNMENT_FAILED' }, { status: 422 }); }
}

