import Link from 'next/link';

export const HOME_TITLE = 'CapacitaGov';

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="landing-nav"><Link className="brand brand-dark" href="/">CapacitaGov</Link><Link className="text-link" href="/login">Entrar</Link></div>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow accent">Formação institucional</p><h1 id="hero-title">Aprender melhor para entregar melhor.</h1><p className="hero-lede">Um ambiente seguro para organizações públicas e privadas organizarem cursos, acompanharem pessoas e comprovarem resultados.</p><div className="hero-actions"><Link className="primary-button" href="/login">Acessar o portal</Link><a className="text-link" href="#como-funciona">Como funciona <span aria-hidden="true">↓</span></a></div></div><div className="hero-panel" aria-label="Visão do CapacitaGov"><span className="panel-kicker">CapacitaGov</span><strong>Catálogo central + cursos próprios</strong><p>Uma experiência clara para cada papel: aluno, professor e gestão.</p><div className="panel-stat"><span>Organizações conectadas</span><strong>com segurança</strong></div></div></section>
      <section id="como-funciona" className="value-grid" aria-label="Benefícios"><article><span className="value-number">01</span><h2>Para quem aprende</h2><p>Catálogo, progresso, avaliações e certificados em um só lugar.</p></article><article><span className="value-number">02</span><h2>Para quem ensina</h2><p>Turmas e encontros com acesso apenas às pessoas autorizadas.</p></article><article><span className="value-number">03</span><h2>Para quem gere</h2><p>Visão institucional para criar cursos, trilhas e relatórios.</p></article></section>
    </main>
  );
}

