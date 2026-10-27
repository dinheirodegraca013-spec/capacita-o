import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createOffering, listCatalog } from '@/modules/catalog/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { data: membership } = await supabase.from('memberships').select('id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { return NextResponse.json({ items: await listCatalog({ userId: user.id, organizationId, membershipId: membership.id, roles }, supabase as never) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Catalog failed' }, { status: 422 }); }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; courseVersionId?: string; title?: string; mandatory?: boolean; capacity?: number | null; enrollmentPolicy?: 'self_enroll' | 'manager_assigned'; startsAt?: string | null; endsAt?: string | null } | null;
  if (!body?.organizationId || !body.courseVersionId || !body.title || !body.enrollmentPolicy) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { return NextResponse.json(await createOffering({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, { ...body, courseVersionId: body.courseVersionId, title: body.title, mandatory: body.mandatory ?? false, capacity: body.capacity ?? null, enrollmentPolicy: body.enrollmentPolicy }, supabase as never), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Offering failed' }, { status: 422 }); }
}

