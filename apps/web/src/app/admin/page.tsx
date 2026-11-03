import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PlatformAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformAdmin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!platformAdmin) redirect('/selecionar-organizacao');

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, slug, kind, timezone, created_at')
    .order('created_at', { ascending: true });

  const items = organizations ?? [];
  return <main className="selection-page">
    <p className="eyebrow accent">Administração da plataforma</p>
    <h1>Painel do superadmin</h1>
    <p className="muted">Visão geral do CapacitaGov. O superadmin acompanha organizações e habilita os módulos institucionais sem misturar dados entre tenants.</p>

    <section className="admin-summary" aria-label="Resumo da plataforma">
      <article className="summary-card"><strong>{items.length}</strong><span>Organizações</span></article>
      <article className="summary-card"><strong>Catálogo central</strong><span>Disponível para concessão</span></article>
      <article className="summary-card"><strong>RLS ativo</strong><span>Isolamento por organização</span></article>
    </section>

    <section aria-labelledby="organizations-title"><p><a className="text-link" href="/admin/organizacoes">Gerenciar organizações →</a></p>
      <div className="section-heading"><div><p className="eyebrow">Tenants cadastrados</p><h2 id="organizations-title">Organizações</h2></div></div>
      {items.length ? <ul className="organization-list">{items.map((organization) => <li key={organization.id}><div><span className="org-avatar" aria-hidden="true">{organization.name.charAt(0).toUpperCase()}</span><span><strong>{organization.name}</strong><small>{organization.kind} · {organization.slug}</small></span></div><span className="muted">{organization.timezone}</span></li>)}</ul> : <p className="empty-state">Nenhuma organização cadastrada.</p>}
    </section>

    <section className="admin-modules" aria-labelledby="modules-title">
      <p className="eyebrow">Módulos</p>
      <h2 id="modules-title">Próximos painéis</h2>
      <div className="module-grid">
        <article className="module-card"><h3>Organizações e convites</h3><p>Cadastro, gestores e acesso por convite.</p><a className="text-link" href="/admin/organizacoes">Abrir módulo →</a></article>
        <article className="module-card"><h3>Catálogo central</h3><p>Cursos institucionais e concessões por tenant.</p><a className="text-link" href="/admin/catalogo">Abrir catálogo →</a></article>
        <article className="module-card"><h3>Auditoria</h3><p>Eventos, segurança e conformidade.</p><span>Em construção</span></article>
      </div>
    </section>

    <Link className="secondary-button" href="/selecionar-organizacao">Voltar à seleção</Link>
  </main>;
}
