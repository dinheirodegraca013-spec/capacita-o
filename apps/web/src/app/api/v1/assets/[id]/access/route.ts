import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authorizeAsset } from '@/modules/assets/service';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { data: membership } = await supabase.from('memberships').select('id, organization_id, membership_roles(role)').eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { return NextResponse.json(await authorizeAsset({ userId: user.id, organizationId: membership.organization_id, membershipId: membership.id, roles: [] }, id, supabase as never, supabase.storage as never)); }
  catch { return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 }); }
}
