import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { grantCourse } from '@/modules/catalog/service';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { data: admin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const body = await request.json().catch(() => null) as { organizationId?: string; courseVersionId?: string } | null;
  if (!body?.organizationId || !body.courseVersionId) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  try { return NextResponse.json(await grantCourse({ userId: user.id, platformAdmin: true }, { organizationId: body.organizationId, courseVersionId: body.courseVersionId }, supabase as never), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Grant failed' }, { status: 422 }); }
}
