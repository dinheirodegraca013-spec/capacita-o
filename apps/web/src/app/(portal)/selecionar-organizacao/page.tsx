import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SelectOrganizationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: memberships } = await supabase.from('memberships').select('organization_id, organizations(name)').eq('user_id', user.id).eq('status', 'active');
  return <main className="selection-page"><p className="eyebrow accent">Acesso confirmado</p><h1>Escolha a organização</h1><p className="muted">Você tem acesso a mais de uma organização. Escolha onde deseja trabalhar agora.</p><ul className="organization-list">{(memberships ?? []).map((membership) => <li key={membership.organization_id}><a href={`/o/${membership.organization_id}`}><span className="org-avatar" aria-hidden="true">{String((membership.organizations as { name?: string } | null)?.name ?? 'O').charAt(0).toUpperCase()}</span><span><strong>{String((membership.organizations as { name?: string } | null)?.name ?? 'Organização')}</strong><small>Acessar portal</small></span><span aria-hidden="true">→</span></a></li>)}</ul></main>;
}

