import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PathManagementForm } from '@/components/paths/path-management-form';
export const dynamic = 'force-dynamic';
export default async function PathsPage({ params }: { params: Promise<{ orgId: string }> }) { const { orgId } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login'); const { data: paths } = await supabase.from('learning_paths').select('id, title, status').eq('organization_id', orgId).order('created_at', { ascending: false }); return <section className="stack"><h1>Trilhas de aprendizagem</h1><PathManagementForm organizationId={orgId} /><ul>{(paths ?? []).map((path) => <li key={path.id}>{path.title} — {path.status}</li>)}</ul></section>; }
