import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SelectOrganizationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: memberships } = await supabase.from('memberships').select('organization_id, organizations(name)').eq('user_id', user.id).eq('status', 'active');
  const activeMemberships = memberships ?? [];
  return <main className="selection-page"><p className="eyebrow accent">Acesso confirmado</p><h1>{activeMemberships.length ? 'Escolha a organização' : 'Conta criada'}</h1><p className="muted">{activeMemberships.length ? 'Escolha onde deseja trabalhar agora.' : 'Sua conta está pronta. Aguarde um convite ou a atribuição de uma organização pelo gestor.'}</p>{activeMemberships.length ? <ul className="organization-list">{activeMemberships.map((membership) => <li key={membership.organization_id}><a href={`/o/${membership.organization_id}`}><span className="org-avatar" aria-hidden="true">{String((membership.organizations as { name?: string } | null)?.name ?? 'O').charAt(0).toUpperCase()}</span><span><strong>{String((membership.organizations as { name?: string } | null)?.name ?? 'Organização')}</strong><small>Acessar portal</small></span><span aria-hidden="true">→</span></a></li>)}</ul> : <Link className="primary-button" href="/login">Voltar ao login</Link>}</main>;
}

