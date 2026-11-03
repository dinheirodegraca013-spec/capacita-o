import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!platformAdmin) redirect('/selecionar-organizacao');

  const { data: events } = await supabase
    .from('audit_events')
    .select('id, organization_id, actor_user_id, action, resource_type, outcome, request_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <main className="selection-page">
      <p className="eyebrow accent">Administração da plataforma</p>
      <h1>Auditoria e segurança</h1>
      <p className="muted">Últimos eventos registrados pelo CapacitaGov. Os dados são somente leitura e respeitam o isolamento definido no banco.</p>
      {events?.length ? (
        <div className="card" style={{ overflowX: 'auto', marginTop: '2rem' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '44rem', width: '100%' }}>
            <thead><tr>
              <th style={{ textAlign: 'left', padding: '.65rem', borderBottom: '1px solid var(--line)' }}>Data</th>
              <th style={{ textAlign: 'left', padding: '.65rem', borderBottom: '1px solid var(--line)' }}>Ação</th>
              <th style={{ textAlign: 'left', padding: '.65rem', borderBottom: '1px solid var(--line)' }}>Recurso</th>
              <th style={{ textAlign: 'left', padding: '.65rem', borderBottom: '1px solid var(--line)' }}>Resultado</th>
              <th style={{ textAlign: 'left', padding: '.65rem', borderBottom: '1px solid var(--line)' }}>Organização</th>
            </tr></thead>
            <tbody>{events.map((event) => (
              <tr key={event.id}>
                <td style={{ padding: '.65rem', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{new Date(event.created_at).toLocaleString('pt-BR')}</td>
                <td style={{ padding: '.65rem', borderBottom: '1px solid var(--line)' }}>{event.action}</td>
                <td style={{ padding: '.65rem', borderBottom: '1px solid var(--line)' }}>{event.resource_type}</td>
                <td style={{ padding: '.65rem', borderBottom: '1px solid var(--line)' }}>{event.outcome}</td>
                <td style={{ padding: '.65rem', borderBottom: '1px solid var(--line)', fontFamily: 'monospace', fontSize: '.78rem' }}>{event.organization_id ?? 'plataforma'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="empty-state" style={{ marginTop: '2rem' }}>Nenhum evento de auditoria registrado ainda.</p>}
      <p style={{ marginTop: '1.5rem' }}><Link className="secondary-button" href="/admin">Voltar ao painel</Link></p>
    </main>
  );
}
