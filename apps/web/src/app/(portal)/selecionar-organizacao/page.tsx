import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SelectOrganizationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: memberships } = await supabase.from('memberships').select('organization_id, organizations(name)').eq('user_id', user.id).eq('status', 'active');
  return <main><h1>Escolha a organização</h1><ul>{(memberships ?? []).map((membership) => <li key={membership.organization_id}><a href={`/o/${membership.organization_id}`}>{String((membership.organizations as { name?: string } | null)?.name ?? 'Organização')}</a></li>)}</ul></main>;
}
