import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, context: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string; kind?: string; timezone?: string; slug?: string } | null;
  if (!body?.name || !body.kind || !body.timezone) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data, error } = await supabase.from('organizations').update({ name: body.name.trim(), kind: body.kind, timezone: body.timezone, slug: body.slug?.trim().toLowerCase() }).eq('id', orgId).select().single();
  if (error) return NextResponse.json({ error: error.code === '42501' ? 'FORBIDDEN' : 'UNAVAILABLE' }, { status: error.code === '42501' ? 403 : 503 });
  return NextResponse.json({ organization: data });
}
