import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authorizeAsset } from '@/modules/assets/service';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  // Resolve the asset's tenant first. A user can belong to multiple organizations;
  // selecting an arbitrary membership could deny a valid asset or authorize the
  // wrong tenant context before the service-level asset check runs.
  const { data: asset } = await supabase.from('assets').select('organization_id').eq('id', id).maybeSingle();
  if (!asset) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', String(asset.organization_id)).eq('status', 'active').maybeSingle();
  if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { return NextResponse.json(await authorizeAsset({ userId: user.id, organizationId: membership.organization_id, membershipId: membership.id, roles: [] }, id, supabase as never, supabase.storage as never)); }
  catch { return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 }); }
}

