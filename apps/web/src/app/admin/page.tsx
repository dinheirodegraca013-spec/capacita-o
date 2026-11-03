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

  return <main className="selection-page">
    <p className="eyebrow accent">Administração da plataforma</p>
    <h1>Painel do superadmin</h1>
    <p className="muted">Você está autenticado como administrador da plataforma. A gestão de organizações, convites e catálogo central será disponibilizada neste painel conforme os módulos forem habilitados.</p>
    <div className="auth-actions">
      <Link className="primary-button" href="/selecionar-organizacao">Voltar à seleção</Link>
      <Link className="secondary-button" href="/">Ir para a página inicial</Link>
    </div>
  </main>;
}
