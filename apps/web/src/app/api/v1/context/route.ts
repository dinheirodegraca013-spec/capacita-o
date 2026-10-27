import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });

  const { data, error } = await supabase
    .from('memberships')
    .select('id, organization_id, status, organizations(id, name, slug, kind, timezone)')
    .eq('user_id', user.id)
    .eq('status', 'active');
  if (error) return NextResponse.json({ error: 'UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  return NextResponse.json({ userId: user.id, memberships: data ?? [] }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
