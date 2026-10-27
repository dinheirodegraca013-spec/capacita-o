import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; moduleTitle?: string; lessons?: Array<{ title?: string; content?: string }> } | null;
  if (!body?.organizationId || !body.moduleTitle?.trim() || !body.lessons?.length || body.lessons.some((lesson) => !lesson.title?.trim())) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle();
  const roles = ((membership?.membership_roles ?? []) as Array<{ role: string }>).map((item) => item.role); if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const { data: version } = await supabase.from('course_versions').select('id, status').eq('course_id', (await params).id).eq('status', 'draft').maybeSingle(); if (!version) return NextResponse.json({ error: 'DRAFT_NOT_FOUND' }, { status: 422 });
  const { data: prior } = await supabase.from('course_modules').select('position').eq('course_version_id', version.id).order('position', { ascending: false }).limit(1).maybeSingle();
  const { data: module, error: moduleError } = await supabase.from('course_modules').insert({ course_version_id: version.id, title: body.moduleTitle.trim(), position: (prior?.position ?? -1) + 1 }).select('id').single(); if (moduleError || !module) return NextResponse.json({ error: moduleError?.message ?? 'MODULE_FAILED' }, { status: 422 });
  const lessons = body.lessons.map((lesson, index) => ({ module_id: module.id, title: lesson.title?.trim() ?? '', content: lesson.content?.trim() ?? '', position: index }));
  const { error } = await supabase.from('course_lessons').insert(lessons); if (error) return NextResponse.json({ error: error.message }, { status: 422 });
  return NextResponse.json({ moduleId: module.id }, { status: 201 });
}

