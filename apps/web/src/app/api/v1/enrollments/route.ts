import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { enroll } from '@/modules/enrollments/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; offeringId?: string; membershipId?: string } | null;
  if (!body?.organizationId || !body.offeringId || !body.membershipId) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    return NextResponse.json(await enroll({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, { offeringId: body.offeringId, membershipId: body.membershipId }, supabase as never), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Enrollment failed';
    const status = message.includes('FORBIDDEN') ? 403 : message.includes('FULL') ? 409 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
