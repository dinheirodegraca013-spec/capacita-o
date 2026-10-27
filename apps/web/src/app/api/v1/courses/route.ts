import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createCourse } from '@/modules/courses/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; title?: string; slug?: string; description?: string; learningMode?: 'self_paced' | 'instructor_led'; licenseConfirmed?: boolean } | null;
  if (!body?.organizationId || !body.title || !body.slug) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const result = await createCourse({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, body as { title: string; slug: string; description?: string; learningMode?: 'self_paced' | 'instructor_led'; licenseConfirmed?: boolean }, supabase as never);
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Course creation failed' }, { status: 422 }); }
}
