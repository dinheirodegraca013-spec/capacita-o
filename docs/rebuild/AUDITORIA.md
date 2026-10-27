# Auditoria da reconstrução

Estado: em andamento; publicação técnica disponível, mas liberação integral ainda não aprovada.

Evidências confirmadas: cadeia nova de migrations aplicada em PostgreSQL 18.6 temporário e no Supabase autorizado, pgTAP local **28 arquivos/199 testes**, hardening de funções `SECURITY DEFINER`, escopo de catálogo central/concessões, cursos próprios e integridade entre organizações em turmas/encontros, testes web 46/46, typecheck/lint/build e Playwright de produção **3/3** com Auth real e jornadas autoinstrucional/híbrida. Pendências de liberação: SMTP/observabilidade, preview com dados isolados, CI remoto, recuperação/rollback, validação jurídica LGPD e push GitHub.

O deployment de produção usa somente variáveis públicas do Supabase no navegador; service role não é enviada ao bundle. A conta e organização temporárias de E2E foram removidas após a validação. O próximo gate é concluir dependências operacionais e repetir a auditoria final com o HEAD publicado.

## UX/UI — 27/10/2026

A reconstrução visual institucional foi implementada e validada por typecheck, lint e build. O shell agora comunica organização ativa, destaca a rota atual, oferece foco por teclado e adaptação mobile; landing, login e seleção de organização receberam hierarquia, feedback e estados vazios mais claros. A validação visual pública da nova versão deve acompanhar o próximo deployment.
## Reauditoria de autorização — 27/10/2026

A revisão independente encontrou falhas de escopo do catálogo central, cursos próprios, matrícula e presença. As migrations `20261027030000_authorization_regressions.sql` e `20261027050000_harden_catalog_scope.sql` corrigiram esses contratos; `20261027033000_harden_offering_trigger_privilege.sql` removeu a execução pública do trigger de validação.

Evidência: 28 arquivos/199 testes pgTAP PASS no PostgreSQL temporário; as migrations de autorização foram aplicadas remotamente no projeto Supabase exclusivo. E2E autenticado de produção passou 3/3; permanecem SMTP/observabilidade, preview isolado, recuperação/rollback e validação jurídica LGPD.

## Publicação Vercel — 27/10/2026

O deployment `dpl_7KE9Cje9s6YFSVBbXYEZt8VYsj6w` foi construído como produção a partir da árvore local de `apps/web`, com `next build`, e ficou READY. O domínio `https://capacita-o-x5hg.vercel.app/` respondeu 200 em `/` e `/login`; o Playwright autenticado confirmou 3/3 jornadas após a correção da seleção de organização.

Atualização: o deployment `dpl_54N1x6Pydz8YTPd3BMMYrhwFkq38` foi criado explicitamente com `rootDirectory=apps/web`, `framework=nextjs` e `npm run build`, ficou READY e recebeu o alias principal. A validação final retornou 200 em `/` e `/login` com a nova landing/login. O deployment automático `dpl_9XVyAaudxQphFsSRARP39KBJgTgP` foi mantido fora do alias por ainda servir o Vite legado.

