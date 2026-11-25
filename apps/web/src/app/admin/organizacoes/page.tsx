import { redirect } from 'next/navigation';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function createOrganization(formData: FormData) {
  'use server';
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: admin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) redirect('/selecionar-organizacao');
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') redirect('/mfa?next=/admin/organizacoes');
  const name = String(formData.get('name') ?? '').trim();
  const kind = String(formData.get('kind') ?? 'other');
  const timezone = String(formData.get('timezone') ?? 'America/Sao_Paulo');
  if (!name || name.length > 180) return;
  const { error } = await supabase.rpc('create_organization_for_platform_admin', {
    p_name: name,
    p_slug: slugify(name),
    p_kind: kind,
    p_timezone: timezone,
  });
  if (error) return;
  revalidatePath('/admin');
  revalidatePath('/admin/organizacoes');
}

export default async function OrganizationsAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: admin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) redirect('/selecionar-organizacao');
  const { data: pageAssurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (pageAssurance?.currentLevel !== 'aal2') redirect('/mfa?next=/admin/organizacoes');
  const { data: organizations } = await supabase.from('organizations').select('id,name,slug,kind,timezone').order('created_at', { ascending: true });
  return <main className="selection-page">
    <p className="eyebrow accent">Administração da plataforma</p>
    <h1>Organizações</h1>
    <p className="muted">Crie e acompanhe os tenants do CapacitaGov. O isolamento de dados continua sendo aplicado pelo Supabase.</p>
    <section className="auth-card">
      <h2>Criar organização</h2>
      <form action={createOrganization}>
        <label>Nome<input name="name" required maxLength={180} placeholder="Prefeitura ou empresa" /></label>
        <label>Tipo<select name="kind" defaultValue="company"><option value="company">Empresa</option><option value="municipality">Prefeitura</option><option value="public_agency">Órgão público</option><option value="nonprofit">Organização social</option><option value="other">Outro</option></select></label>
        <label>Fuso horário<input name="timezone" defaultValue="America/Sao_Paulo" required /></label>
        <button className="primary-button" type="submit">Criar organização</button>
      </form>
    </section>
    <section aria-labelledby="org-list-title">
      <p className="eyebrow">Tenants</p><h2 id="org-list-title">Organizações cadastradas</h2>
      {organizations?.length ? <ul className="organization-list">{organizations.map((organization) => <li key={organization.id}><div><span className="org-avatar" aria-hidden="true">{organization.name.charAt(0).toUpperCase()}</span><span><strong>{organization.name}</strong><small>{organization.kind} · {organization.slug}</small></span></div><span className="muted">{organization.timezone}</span></li>)}</ul> : <p className="empty-state">Nenhuma organização cadastrada.</p>}
    </section>
    <Link className="secondary-button" href="/admin">Voltar ao painel</Link>
  </main>;
}
