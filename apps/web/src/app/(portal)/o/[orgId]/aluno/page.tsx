import Link from 'next/link';

export default async function StudentHomePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <section><h1>Minha aprendizagem</h1><p>Continue seus cursos e encontre novas formações da sua organização.</p><div className="action-grid"><Link className="primary-button" href={`/o/${orgId}/aluno/cursos`}>Meus cursos</Link><Link className="secondary-button" href={`/o/${orgId}/aluno/catalogo`}>Explorar catálogo</Link></div></section>;
}
