import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { previewImport } from '@/modules/imports/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; rows?: Array<{ name: string; email: string; cpf?: string }>; sizeBytes?: number } | null;
  if (!body?.organizationId || !body.rows) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const result = previewImport({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, body.rows, body.sizeBytes ?? 0);
  return NextResponse.json(result, { status: result.valid ? 200 : 422 });
}
