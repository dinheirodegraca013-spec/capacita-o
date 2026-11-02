import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const body = await request.json().catch(() => null) as { organizationId?: unknown; title?: unknown; description?: unknown } | null;
  if (
    typeof body?.organizationId !== 'string' ||
    !body.organizationId.trim() ||
    typeof body.title !== 'string' ||
    !body.title.trim() ||
    (body.description !== undefined && typeof body.description !== 'string')
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

  const title = body.title.trim();
  if (title.length > 180) return NextResponse.json({ error: 'TITLE_TOO_LONG' }, { status: 422 });

  const { data, error } = await supabase
    .from('learning_paths')
    .insert({
      organization_id: body.organizationId,
      title,
      description: body.description?.trim() ?? '',
      created_by: user.id,
    })
    .select('id, title, status')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 422 });
  return NextResponse.json(data, { status: 201 });
}
