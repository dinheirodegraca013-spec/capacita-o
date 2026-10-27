import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { data: asset } = await supabase.from('assets').select('id, organization_id, object_path, status').eq('id', id).maybeSingle();
  if (!asset) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', String(asset.organization_id)).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  if (asset.status === 'ready') return NextResponse.json({ asset: { id: asset.id, status: 'ready' } });
  const parts = String(asset.object_path).split('/');
  const fileName = parts.pop();
  const folder = parts.join('/');
  if (!fileName || !folder) return NextResponse.json({ error: 'ASSET_PATH_INVALID' }, { status: 422 });
  try {
    const admin = createSupabaseAdminClient();
    const { data: objects, error: storageError } = await admin.storage.from('course-assets').list(folder, { limit: 100, search: fileName });
    if (storageError) return NextResponse.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 });
    if (!(objects ?? []).some((object) => object.name === fileName)) return NextResponse.json({ error: 'UPLOAD_NOT_FOUND' }, { status: 409 });
    const { data: updated, error } = await admin.from('assets').update({ status: 'ready' }).eq('id', id).eq('organization_id', asset.organization_id).select('id, status').maybeSingle();
    if (error || !updated) return NextResponse.json({ error: 'ASSET_UPDATE_FAILED' }, { status: 503 });
    return NextResponse.json({ asset: updated });
  } catch {
    return NextResponse.json({ error: 'ASSET_UPDATE_FAILED' }, { status: 503 });
  }
}

