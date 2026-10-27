'use client';

import { usePathname } from 'next/navigation';
import type { OrganizationRole } from '@/modules/identity/model';

export type MenuItem = { label: string; href: string; roles: OrganizationRole[] };
const MENU: MenuItem[] = [
  { label: 'Meus cursos', href: '/aluno/cursos', roles: ['student', 'instructor', 'manager'] },
  { label: 'Catálogo', href: '/aluno/catalogo', roles: ['student', 'instructor', 'manager'] },
  { label: 'Certificados', href: '/aluno/certificados', roles: ['student', 'instructor', 'manager'] },
  { label: 'Minhas turmas', href: '/aluno/turmas', roles: ['student'] },
  { label: 'Painel do professor', href: '/professor', roles: ['instructor'] },
  { label: 'Turmas', href: '/gestao/turmas', roles: ['manager'] },
  { label: 'Avaliações', href: '/gestao/avaliacoes', roles: ['manager'] },
  { label: 'Relatórios', href: '/gestao/relatorios', roles: ['manager'] },
  { label: 'Trilhas', href: '/gestao/trilhas', roles: ['manager'] },
  { label: 'Catálogo institucional', href: '/gestao/catalogo', roles: ['manager'] },
  { label: 'Gestão', href: '/gestao', roles: ['manager'] },
];

export function menuForRoles(roles: OrganizationRole[]) {
  return MENU.filter((item) => item.roles.some((role) => roles.includes(role)));
}

export function PortalShell({ organizationName, organizationId, roles, children }: { organizationName: string; organizationId: string; roles: OrganizationRole[]; children: React.ReactNode }) {
  const items = menuForRoles(roles);
  const pathname = usePathname();
  return <div className="portal-shell"><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><header className="portal-header"><a className="brand" href={`/o/${organizationId}`} aria-label="CapacitaGov, início"><span className="brand-mark" aria-hidden="true">C</span><span>CapacitaGov</span></a><div className="header-context"><span className="eyebrow">Organização ativa</span><span className="organization-name" title={organizationName}>{organizationName}</span></div><form action="/auth/signout" method="post"><button className="secondary-button" type="submit">Sair</button></form></header><div className="portal-body"><nav aria-label="Navegação institucional" className="portal-nav"><p className="nav-heading">Seu espaço</p><ul>{items.map((item) => { const href = `/o/${organizationId}${item.href}`; const active = pathname === href || (item.href !== '/' && pathname.startsWith(href)); return <li key={item.label}><a className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} href={href}>{item.label}</a></li>; })}</ul></nav><main id="conteudo" className="portal-content">{children}</main></div></div>;
}

