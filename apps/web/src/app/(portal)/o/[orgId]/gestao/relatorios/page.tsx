import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OrganizationReport } from '@/components/reports/organization-report';
export const dynamic = 'force-dynamic';
export default async function ReportsPage({ params }: { params: Promise<{ orgId: string }> }) { const { orgId } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login'); return <section className="stack"><h1>Relatórios institucionais</h1><OrganizationReport organizationId={orgId} /></section>; }
