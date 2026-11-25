import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    organizationId?: unknown;
    offeringId?: unknown;
    title?: unknown;
    prerequisiteItemId?: unknown;
  } | null;
  const optionalReference = (value: unknown) => value === undefined || value === null || typeof value === 'string';
  if (
    typeof body?.organizationId !== 'string' ||
    !body.organizationId.trim() ||
    typeof body.title !== 'string' ||
    !body.title.trim() ||
    !optionalReference(body.offeringId) ||
    !optionalReference(body.prerequisiteItemId)
  ) {
    return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('id, membership_roles(role)')
    .eq('user_id', user.id)
    .eq('organization_id', body.organizationId)
    .eq('status', 'active')
    .maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: string }>).map((item) => item.role);
  if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const pathId = (await params).id;
  const { data: path } = await supabase
    .from('learning_paths')
    .select('id')
    .eq('id', pathId)
    .eq('organization_id', body.organizationId)
    .maybeSingle();
  if (!path) return NextResponse.json({ error: 'PATH_NOT_FOUND' }, { status: 404 });

  if (body.offeringId) {
    const { data: offering } = await supabase
      .from('offerings')
      .select('id')
      .eq('id', body.offeringId)
      .eq('organization_id', body.organizationId)
      .maybeSingle();
    if (!offering) return NextResponse.json({ error: 'OFFERING_NOT_FOUND' }, { status: 422 });
  }
  if (body.prerequisiteItemId) {
    const { data: prerequisite } = await supabase
      .from('path_items')
      .select('id')
      .eq('id', body.prerequisiteItemId)
      .eq('path_id', pathId)
      .maybeSingle();
    if (!prerequisite) return NextResponse.json({ error: 'PREREQUISITE_NOT_FOUND' }, { status: 422 });
  }

  const title = body.title.trim();
  if (title.length > 180) return NextResponse.json({ error: 'TITLE_TOO_LONG' }, { status: 422 });
  const { data: prior } = await supabase
    .from('path_items')
    .select('position')
    .eq('path_id', pathId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from('path_items')
    .insert({
      path_id: pathId,
      offering_id: body.offeringId ?? null,
      title,
      position: (prior?.position ?? -1) + 1,
      prerequisite_item_id: body.prerequisiteItemId ?? null,
    })
    .select('id, title, position')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 422 });
  return NextResponse.json(data, { status: 201 });
}
