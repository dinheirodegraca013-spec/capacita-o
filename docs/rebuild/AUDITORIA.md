# Auditoria da reconstrução

Estado: em andamento; publicação técnica disponível, mas liberação integral ainda não aprovada.

Evidências confirmadas: cadeia nova de migrations aplicada em PostgreSQL 18.6 temporário e no Supabase autorizado, pgTAP local **28 arquivos/199 testes**, hardening de funções `SECURITY DEFINER`, escopo de catálogo central/concessões, cursos próprios e integridade entre organizações em turmas/encontros, testes web 46/46, typecheck/lint/build e Playwright de produção **3/3** com Auth real e jornadas autoinstrucional/híbrida. Pendências de liberação: SMTP/observabilidade, preview com dados isolados, CI remoto, recuperação/rollback, validação jurídica LGPD e push GitHub.

O deployment de produção usa somente variáveis públicas do Supabase no navegador; service role não é enviada ao bundle. A conta e organização temporárias de E2E foram removidas após a validação. O próximo gate é concluir dependências operacionais e repetir a auditoria final com o HEAD publicado.

### Atualização de evidências — 27/10/2026

O branch de reconstrução foi publicado pelo conector GitHub. CI remoto recente aprovou migrations/pgTAP e web (typecheck, lint, testes e build), incluindo os runs `40454215760` e `40454215729`. O deployment Next ativo continua no alias `capacita-o-x5hg.vercel.app`; o teste `preview.spec.ts` passou 2/2 contra o domínio, cobrindo rota profunda sem 404 e contexto anônimo sem cache. Ainda não há contas oficiais de homologação para repetir as jornadas autenticadas de duas organizações, nem credenciais de SMTP/worker ou ensaio de backup/restauração.

## UX/UI — 27/10/2026

A reconstrução visual institucional foi implementada e validada por typecheck, lint e build. O shell agora comunica organização ativa, destaca a rota atual, oferece foco por teclado e adaptação mobile; landing, login e seleção de organização receberam hierarquia, feedback e estados vazios mais claros. A validação visual pública da nova versão deve acompanhar o próximo deployment.
## Reauditoria de autorização — 27/10/2026

A revisão independente encontrou falhas de escopo do catálogo central, cursos próprios, matrícula e presença. As migrations `20261027030000_authorization_regressions.sql` e `20261027050000_harden_catalog_scope.sql` corrigiram esses contratos; `20261027033000_harden_offering_trigger_privilege.sql` removeu a execução pública do trigger de validação.

Evidência: 28 arquivos/199 testes pgTAP PASS no PostgreSQL temporário; as migrations de autorização foram aplicadas remotamente no projeto Supabase exclusivo. E2E autenticado de produção passou 3/3; permanecem SMTP/observabilidade, preview isolado, recuperação/rollback e validação jurídica LGPD.

## Publicação Vercel — 27/10/2026

O deployment `dpl_7KE9Cje9s6YFSVBbXYEZt8VYsj6w` foi construído como produção a partir da árvore local de `apps/web`, com `next build`, e ficou READY. O domínio `https://capacita-o-x5hg.vercel.app/` respondeu 200 em `/` e `/login`; o Playwright autenticado confirmou 3/3 jornadas após a correção da seleção de organização.

Atualização: o deployment `dpl_54N1x6Pydz8YTPd3BMMYrhwFkq38` foi criado explicitamente com `rootDirectory=apps/web`, `framework=nextjs` e `npm run build`, ficou READY e recebeu o alias principal. A validação final retornou 200 em `/` e `/login` com a nova landing/login. O deployment automático `dpl_9XVyAaudxQphFsSRARP39KBJgTgP` foi mantido fora do alias por ainda servir o Vite legado.
- **Resend — 27/10/2026:** domínio remetente verificado `gestio.dev.br`; chave com escopo mínimo armazenada somente como variável sensível no Vercel; endpoint não expõe a chave e resolve destinatário pelo Supabase Auth Admin. Pendentes: `service_role`, segredo do scheduler, teste controlado e SMTP do Auth (indisponível no conector Supabase).
- **Fechamento — 27/10/2026:** chaves de teste revogadas; segredo do scheduler configurado; alias de produção validado. `service_role` continua sem fonte segura no conector e não foi inventada.
- **Imagens — 27/10/2026:** asset gerado sem texto/logotipo, com alt text e layout responsivo; verificação local passou. Produção ainda exibe a versão anterior até liberar novo deployment.

## Auditoria intermediária — 27/10/2026

**Parecer: BLOCKED para liberação integral; implementação continua em andamento.**

Evidências novas: callback de convite com `code`/`token_hash`, navegação responsiva em 360px, ofertas para todas as versões publicadas, typecheck/testes/build locais e CI remoto web + pgTAP verdes. O branch `feat/capacitagov-rebuild` permanece limpo e o PR continua draft.

Pendências que impedem PASS: E2E autenticado de duas organizações com contas de homologação explícitas; teste operacional de convite/SMTP e worker; backup, restauração e rollback ensaiados; preview Vercel do HEAD atual. A criação do preview foi tentada com o repositório correto e está bloqueada pela cota `api-deployments-free-per-day` (HTTP 402). Produção não foi alterada nesta auditoria.

