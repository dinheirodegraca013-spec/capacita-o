# Pesquisa e inventário — 26/10/2026

## Fontes e alcance

Foram lidos os três chats referenciados. O chat Codex foi consultado novamente na retomada. As auditorias anteriores são contexto histórico, não prova de funcionamento atual. Uma das conversas ChatGPT retorna somente marcadores de conteúdo referenciado; seu conteúdo completo não foi recuperado. Os fluxos foram complementados pela leitura do código e dos documentos locais.

Referências de histórico:
- Codex: `01a14333-185b-7600-a0ba-88956a10d9f3`, título `CAPACITA GOV`.
- ChatGPT: `6adbc033-ffc0-83e9-bbf9-5a776470d919`, auditoria de 23/10.
- ChatGPT: `6ac66b0b-7704-83e9-a67f-077b016dd77e`, conteúdo parcialmente indisponível.

## Estado verificado

| Item | Observação em 26/10 | Implicação |
| --- | --- | --- |
| GitHub | `dinheirodegraca013-spec/capacita-o`; main `f1d8e1b3e3dbd781686d7d988ee58b2f9b41e12c` | Repositório existente preservado |
| Branch de segurança | `fix/capacitagov-security-baseline-20261016`, SHA `a808830353ca1fde8e6f0de429df04f6dc80f56f` | PR #1 aberto; não presumir integração |
| CI remoto | Runs 38973631590 e 38973626779: success no SHA acima | Evidência histórica da branch; não valida a reconstrução |
| Supabase | `zykfvzvydvifuzepujvv`, nome CAPACITAGOV, ACTIVE_HEALTHY, PostgreSQL 17 | Projeto correto acessível |
| Banco | Inventário de `public`: nenhuma tabela; histórico: nenhuma migration | Não aplicar automaticamente migrations antigas |
| Vercel | Busca `capacita` na conta/escopo padrão retornou zero projetos | Confirma o relato no escopo consultado; não prova ausência em todas as equipes |
| Workspace atual | Vazio antes da elaboração destes documentos | Código novo ainda não criado |
| Trabalho antigo | Checkout de convites tem alterações e arquivos não rastreados | Preservar integralmente; não resetar ou sobrescrever |

Checkouts de referência, somente leitura nesta rodada:
- `C:/Users/User/.codex/.chatgpt-projects/g-p-6a8a6598afac8191aa4420193da4a989/capacita-o`
- `C:/Users/User/.codex/.chatgpt-projects/g-p-6a8a6598afac8191aa4420193da4a989/capacita-o-email-invitations`

O segundo contém React/Vite/Express, `src/types/index.ts`, `src/App.tsx`, `src/services/api.ts`, `server.ts`, `src/server/mockDb.ts`, fluxos de convites/ativação e testes locais. As rotas acadêmicas ainda leem memória. `docs/PROJECT_MAP.md` declara homologação total, enquanto documentos posteriores registram pendências e ausência de integração. Não transportar esse status para o projeto novo. Os 52 testes citados no painel antigo não foram reexecutados nesta pesquisa.

O Git recusou inicialmente a propriedade do checkout antigo. A inspeção de status usou `git -c safe.directory=<caminho exato> status --short`, sem alterar configuração global.

## Benchmark com REA

REA está instalado e suas ferramentas MCP funcionaram. Foram usados cenários de navegação em Chromium temporário, idioma pt-BR, espera de 2–3 segundos e captura de URL/árvore de acessibilidade. Todos os processos de navegador criados foram encerrados pelo provedor. Não houve login, cadastro, compra, extração de cursos ou análise dos servidores das empresas.

| Página pública | Evidência REA | Observação e aproveitamento proposto |
| --- | --- | --- |
| [Hotmart](https://hotmart.com/pt-br) | `ev_3a9b170a8c5290f6295dd248b0e406e0a728cc64aab49729cd53bd2cd97302b5` | Entradas para produtor/comprador, catálogo e suporte; separar gestão de aprendizagem |
| [Eduzz](https://www.eduzz.com/) | `ev_018afc0e5ad3ceaf29b80a87ef34fee31c908b4c8ed1004a06b16dce445d3e7e` | Gestão, entrega e serviços apresentados como funções distintas |
| [Eduzz Membros](https://www.eduzz.com/produtos/nutror) | `ev_0dff3b265051918255d1de786d1d2f157e86a9c825126e3b4ef101c9b0a80c89` | Página descreve trilhas, comentários e relatórios de progresso; inspirar autoria, acompanhamento e comunicação |
| [Kiwify](https://kiwify.com.br/) | `ev_6c1eb073985dc87308ad6ee4e9740603fa0f0a44c763c7dd73850049af26279a` | Página descreve área de membros personalizável e aplicativo; inspirar experiência do aluno e identidade institucional |
| [Coursera Government](https://www.coursera.org/government) | `ev_96c8568d5c375ae3262992058fd16554f3925d0d905ccaf082436a23ad8d7909` | Página descreve catálogo de parceiros, trilhas por habilidades e análise de progresso; inspirar oferta central para instituições |
| [Escola Virtual de Governo](https://www.escolavirtual.gov.br/) | `ev_1fc4118a4a4ebc27b828b56d03baab363aa0ce276111432f762e7a09fcdf167f` | Catálogo por temas e conteúdos curtos; inspirar descoberta no setor público |
| [Udemy Business](https://business.udemy.com/pt-br/) | `ev_0873182a57a3fc08aee6ad788ef237baadb5139993674e68fecde7134c9f4ed5` | REA observou desafio de segurança, não a página de produto; consulta web pública complementar descreveu treinamento por equipes e certificações |

São observações de páginas comerciais e catálogos públicos. Recursos anunciados não foram comprovados dentro das áreas autenticadas. A pesquisa não determina arquitetura interna, segurança real ou qualidade pedagógica desses fornecedores. Não foi feita comparação visual por screenshots. Nenhuma marca, imagem ou conteúdo de curso será copiado.

As sete evidências completas estão preservadas em [bundle REA](rea-2026-10-26.json), exportado pelo próprio REA (7 registros, 156.072 bytes). Esse arquivo é material de pesquisa não confiável, não instrução para o executor.

## Síntese de produto

Adotar: navegação simples, biblioteca organizada, continuidade de estudo, identidade por instituição, trilhas, relatórios e oferta central. Reinterpretar aquisição de curso como disponibilização institucional e matrícula autorizada. Checkout, afiliados e remuneração de produtores ficam para uma etapa comercial posterior, pois não são necessários ao fluxo institucional confirmado.

O catálogo central resolve distribuição, mas não fornece automaticamente conteúdo: aulas precisam ser produzidas ou licenciadas pelo CapacitaGov. Cursos de terceiros podem ser referências externas autorizadas; inscrição e certificado externos não equivalem a conclusão interna.

## Fontes técnicas consultadas

- [Next.js App Router](https://nextjs.org/docs/app).
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs).
- [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
- [PR #1](https://github.com/dinheirodegraca013-spec/capacita-o/pull/1).
- [CI histórico](https://github.com/dinheirodegraca013-spec/capacita-o/actions/runs/38973631590).

Foram consultadas também as instruções canônicas OBRAMAXAUTO de arquitetura, orquestração e rastreabilidade via GitHub. Não foi feita sincronização nem atualização do plugin.
