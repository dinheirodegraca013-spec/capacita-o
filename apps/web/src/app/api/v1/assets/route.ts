import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAssetUpload } from '@/modules/assets/service';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; fileName?: string; mimeType?: string; sizeBytes?: number } | null;
  if (!body?.organizationId || !body.fileName || !body.mimeType || !body.sizeBytes) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const upload = { fileName: body.fileName, mimeType: body.mimeType, sizeBytes: body.sizeBytes };
  try { return NextResponse.json(await createAssetUpload({ userId: user.id, organizationId: body.organizationId, membershipId: membership.id, roles }, upload, supabase as never, supabase.storage as never), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Asset upload failed' }, { status: 422 }); }
}

