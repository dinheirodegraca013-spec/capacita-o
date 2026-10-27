import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateAssessment } from '@/modules/assessments/authoring';
import type { OrganizationRole } from '@/modules/identity/model';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { organizationId?: string; courseVersionId?: string; title?: string; passingScore?: number; timeLimitSeconds?: number | null; maxAttempts?: number; questions?: Array<{ prompt: string; points: number; options: Array<{ label: string; isCorrect: boolean }> }> } | null;
  if (!body?.organizationId || !body.courseVersionId || !body.title || !body.questions) return NextResponse.json({ error: 'VALIDATION' }, { status: 422 });
  const { data: membership } = await supabase.from('memberships').select('id, membership_roles(role)').eq('user_id', user.id).eq('organization_id', body.organizationId).eq('status', 'active').maybeSingle(); const roles = ((membership?.membership_roles ?? []) as Array<{ role: OrganizationRole }>).map((item) => item.role); if (!membership || !roles.includes('manager')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try { const input = { courseVersionId: body.courseVersionId, title: body.title, passingScore: body.passingScore ?? 70, timeLimitSeconds: body.timeLimitSeconds ?? null, maxAttempts: body.maxAttempts ?? 1, questions: body.questions }; const validation = validateAssessment(input); if (!validation.ok) return NextResponse.json({ error: validation.code }, { status: 422 }); const { data, error } = await supabase.rpc('create_assessment_with_questions', { p_course_version_id: input.courseVersionId, p_title: input.title, p_passing_score: input.passingScore, p_time_limit_seconds: input.timeLimitSeconds, p_max_attempts: input.maxAttempts, p_questions: input.questions }); if (error || !data) throw new Error(error?.message ?? 'ASSESSMENT_FAILED'); return NextResponse.json({ id: data }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'ASSESSMENT_FAILED' }, { status: 422 }); }
}
