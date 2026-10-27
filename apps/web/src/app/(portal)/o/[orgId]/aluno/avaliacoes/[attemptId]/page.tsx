import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ExamRoom } from '@/components/assessments/exam-room';

export const dynamic = 'force-dynamic';
export default async function ExamPage({ params }: { params: Promise<{ orgId: string; attemptId: string }> }) {
  const { orgId, attemptId } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: membership } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle(); if (!membership) redirect(`/o/${orgId}/aluno`);
  return <ExamRoom attemptId={attemptId} organizationId={orgId} />;
}
