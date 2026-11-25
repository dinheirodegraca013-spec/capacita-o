import Link from 'next/link';

export default function SignUpConfirmedPage() {
  return <main className="auth-page"><div className="auth-brand"><Link className="brand brand-dark" href="/">CapacitaGov</Link></div><section className="auth-card" aria-labelledby="confirmed-title"><p className="eyebrow accent">Cadastro recebido</p><h1 id="confirmed-title">Confirme seu e-mail</h1><p className="muted">Enviamos um link de confirmação. Depois de confirmar, entre no portal. O acesso a uma organização será liberado por convite ou atribuição do gestor.</p><Link className="primary-button" href="/login">Ir para o login</Link></section></main>;
}
