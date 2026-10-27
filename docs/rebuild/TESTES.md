# Homologação e evidências

## Evidências históricas preservadas

- PostgreSQL 18 local temporário no WSL com pgTAP: 27 arquivos, 188 testes, todos PASS. A migration legada `20261007_init.legacy.sql` foi isolada fora da cadeia executável; a cadeia nova começa em `20261026212248_identity.sql`.
- Aplicação web: `npm test -- --run` com `46/46`, `npm run typecheck`, `npm run lint` e `npm run build` verdes no SHA registrado no Git.
- Sala de avaliação: migration `20261026220400_assessment_delivery.sql` aplicada no PostgreSQL local; entrega não expõe respostas corretas e a rota/rota de retomada compilam no build.
- Editor de cursos: migration `20261026220500_course_authoring.sql` aplicada no PostgreSQL local; pgTAP `6/6` cobre autoria de aula e publicação licenciada.
- Jornada híbrida: migration `20261026220600_class_enrollment.sql` aplicada; pgTAP de turmas `6/6` e chamada `7/7` verdes, incluindo vínculo de matrícula à turma e confirmação idempotente.
- Relatórios: tela institucional e exportação CSV compilam; acesso continua protegido pela função tenant-scoped `get_organization_report`.
- Catálogo/ofertas: migrations `20261026220700_offering_publication.sql` e `20261027050000_harden_catalog_scope.sql` aplicadas; cursos centrais exigem concessão ativa, enquanto cursos próprios da organização não exigem concessão central.
- Matrícula/turma: pgTAP `3/3` confirma vinculação válida e rejeição de turma de outra oferta.
- Convites: RPC de aceite e ativação por token/email passaram pgTAP `4/4`; SMTP/Auth remoto ainda pendentes.
- Importação: commit de lote usa RPC atômica auditada; parser aceita aspas/vírgulas/CRLF/cabeçalho e validação limita 500 linhas/2 MiB.
- Autoria de avaliações: RPC `20261026221000_assessment_authoring_atomic.sql` grava avaliação, questões e opções em uma transação; migration aplicada local e remotamente, incluída na suíte pgTAP.
- Dependências: `npm audit --audit-level=high` terminou com `found 0 vulnerabilities` após atualizar Playwright para `1.55.1` e Vite para `7.3.7`.
- Suíte SQL completa: os 28 arquivos em `supabase/tests/` foram executados sequencialmente no PostgreSQL 18 local, todos com as asserções pgTAP aprovadas.

## Estado atual e pendências

- `supabase test db` via wrapper oficial: ambiente Docker indisponível; os scripts SQL foram executados diretamente no PostgreSQL local.
- Playwright histórico: `1 passed, 2 skipped` no baseline. A validação vigente está registrada em “Evidência adicional” abaixo e deve prevalecer sobre esse snapshot.
- Supabase remoto: migrations funcionais/hardening/otimização aplicadas e advisors rechecados; Vercel produção validada no deployment `dpl_7KE9Cje9s6YFSVBbXYEZt8VYsj6w` após as correções de rota e autorização.
- As migrations `20261026220900_import_commit.sql`, `20261026221000_assessment_authoring_atomic.sql` e `20261026221100_notifications_grant.sql` foram aplicadas remotamente e passaram no conjunto pgTAP; seguem pendentes somente as validações operacionais de SMTP/worker.
- O workflow `.github/workflows/sql-regression.yml` executou verde no GitHub Actions em PostgreSQL 16 + pgTAP no run `40451913650`: instalação, bootstrap, aplicação das migrations e `pg_prove` passaram; a migration legada `20261007_init.sql` é explicitamente excluída da cadeia nova. A suíte local permanece 28/199 PASS.

Não marcar a meta final como PASS enquanto SMTP, recuperação/rollback, preview isolado e revisão independente final não forem executados.
## Evidência adicional — 27/10/2026

- `npm run typecheck` em `apps/web`: PASS.
- `npm test -- --run` em `apps/web`: 24 arquivos, 46 testes, PASS.
- `pg_prove` em PostgreSQL 18.6 temporário isolado: 28 arquivos, 199 testes, PASS.
- Otimização RLS/FK: migrations `20261027040000`, `20261027041000` e `20261027042000` aplicadas local/remotamente; a suíte permaneceu em 28 arquivos/199 testes PASS. Advisor de performance remoto deixou 0 avisos de FK sem índice e 0 avisos `auth_rls_initplan`; os avisos INFO restantes são índices ainda não utilizados em banco sem carga.
- Migration de regressões de autorização aplicada ao Supabase `zykfvzvydvifuzepujvv`; nenhum dado de negócio foi criado remotamente.
- Vercel staging `dpl_DckTKDxF8d4fBNHwC6RjHdjC6BYm` ficou READY e validou `/` e `/login` via fetch protegido; produção `dpl_BxqDDmMf97HygLJd2EkmJU2hkos1` ficou READY e o domínio principal retornou HTTP 200 em `/` e `/login`.
- Playwright contra produção: 1 teste público passou e 2 jornadas autenticadas foram corretamente marcadas como skipped por ausência de credenciais de homologação.
- Vercel runtime: variáveis públicas do Supabase configuradas nos três ambientes; redeploy `dpl_D8d1S5dZz2L3ztx5ScGEb5SHciPN` READY.
- UX/UI e produção: `npm run typecheck`, `npm run lint` e `npm run build` PASS após o redesign institucional. Playwright contra `https://capacita-o-x5hg.vercel.app/`: **2 PASS, 2 skipped** (landing e login públicos PASS; jornadas autenticadas exigem conta temporária explícita). Deployment `dpl_Hr2oQj3oXtdoot42uFnT5b9L9q4J` READY com `rootDirectory=apps/web`; projeto Vercel corrigido para `framework=nextjs`.
- Storage multi-tenant: rota de URL assinada agora resolve o tenant pelo asset antes do vínculo ativo; `npm test -- --run` (**24 arquivos/46 testes PASS**), typecheck, lint e build PASS.
- Upload Storage: `POST /api/v1/assets` retorna URL/token assinado para `course-assets`; teste de integração de capacidade assinada PASS. O processamento que promove `pending` para `ready` continua pendente de worker/observabilidade.
- E2E público contra produção: **3 PASS, 2 skipped**; landing, login e as rotas de upload/acesso Storage retornaram os estados esperados (401 sem sessão). Jornadas autenticadas continuam condicionadas a credenciais temporárias explícitas.
- Dependências: `npm audit --audit-level=high` PASS em `apps/web` (`found 0 vulnerabilities`).
- Regressão de matrícula cancelada: migration `20261027060000_harden_attempt_enrollment_status` aplicada remotamente; consulta de `pg_get_functiondef` confirmou guards ativos em resposta, finalização e entrega de tentativas. O arquivo pgTAP passou a 14 assertions nessa regressão; execução local completa depende do próximo cluster temporário.
- Concorrência do outbox: `claim_pending_notifications` aplicado remotamente com `FOR UPDATE SKIP LOCKED`; privilégios verificados (`service_role` permitido; `authenticated`/`anon` negados). Suíte web após a alteração: **24 arquivos, 47 testes PASS**.
- Deploy de produção da correção: `dpl_CouoDxCq4WCmGvXkrLGRYBkvgAzo` READY, alias `capacita-o-x5hg.vercel.app`; `/` e `/login` HTTP 200, título `CapacitaGov`, e endpoint interno sem segredo HTTP 401.
- T03 e promoção atual: `identity.test.ts` + `session.test.ts` passaram 5/5, cobrindo múltiplos papéis e rejeição cross-tenant. O deployment `dpl_5yKfzvh86PXuCnUucpYiy6q9vhxC` (commit `2dde6974`) ficou READY e recebeu o alias principal; `/` e `/login` HTTP 200, `/api/v1/context` HTTP 401 anônimo com `Cache-Control: no-store`.
- CI remoto após integridade tenant: job pgTAP `122020465587` (run `40453207736`) concluiu `success`, incluindo aplicação das migrations e regressão. Deployment `dpl_4LDQwbm6YeGGRES9hYup8zfzq5KM` ficou READY e foi promovido ao alias principal; `/`, `/login` e `/api/v1/context` foram validados diretamente (200, 200 e 401/no-store).
- Advisor Supabase pós-migration: `unindexed_foreign_keys` ficou sem findings após o índice composto de `instructor_assignments`; só permanecem avisos INFO de índices sem uso observado.
- CI remoto do índice: SQL `40453740988` e web `40453741060` concluíram com sucesso; pgTAP e verificação web (typecheck/lint/test/build) aprovados.
- Novo teste de preview contra `https://capacita-o-x5hg.vercel.app`: `preview.spec.ts` passou **2/2**; rota profunda não retornou 404 e `/api/v1/context` retornou 401 com `Cache-Control: no-store`.
- E2E local com as variáveis públicas do Supabase autorizado: **3 PASS, 2 skipped**. Landing, login e rejeição de Storage sem sessão passaram; os dois cenários autenticados continuam skipped por ausência de conta não produtiva.
- Revisão independente corrigida: migration `20261027062000_tenant_composite_fks.sql` aplicada ao Supabase `zykfvzvydvifuzepujvv`; quatro FKs compostas tenant-scoped confirmadas remotamente e `confirm_attendance` verificado com matrícula/membership ativos. O teste pgTAP `tenant_integrity.test.sql` foi adicionado para cobrir os constraints e os guards de catálogo.
- **Resend — 27/10/2026:** `npm test` (**26 arquivos, 50 testes PASS**) e `npm run typecheck` (**PASS**). Novo teste unitário cobre montagem segura do payload Resend e escape HTML. Não foi executado envio real; falta `SUPABASE_SERVICE_ROLE_KEY` no Vercel.
- **Fechamento — 27/10/2026:** deployment READY; `https://capacita-o-x5hg.vercel.app/` HTTP 200 e título `CapacitaGov`; segredo do scheduler configurado. Envio real permanece bloqueado sem `SUPABASE_SERVICE_ROLE_KEY`.
- **Imagens — 27/10/2026:** `npm run typecheck`, `npm run lint` e `npm run build` **PASS** após adicionar o hero visual. Publicação aguardando limite diário da Vercel.

## Auditoria intermediária atual — 27/10/2026

- Convite: callback aceita `code` e `token_hash`; E2E público cobre callback inválido e o cenário com `token_hash` fica condicionado às variáveis públicas do Supabase.
- Navegação: `tests/e2e/navigation.spec.ts` passou no viewport de 360px com foco por teclado; rota autenticada direta foi omitida localmente sem configuração pública do Supabase.
- Catálogo: a tela de gestão agora renderiza uma oferta para cada versão publicada central/própria; typecheck, 53 testes Vitest e build passaram.
- CI remoto do HEAD documental `5edf8bda1df6a1e8a1ac5e0da48fae5d2ed6ea05`: web run `40472719308` e SQL/pgTAP run `40472719118`, ambos `success`.
- Não contar como PASS final: preview Vercel do HEAD, E2E autenticado de dois tenants, SMTP/worker real e backup/rollback continuam pendentes.
- Importação: após confirmação, a UI envia convites de aluno em lotes de cinco e reporta sucessos/falhas sem reverter o lote persistido; typecheck, Vitest e build passaram. Não foi executado envio SMTP real.
- Cursos próprios: a UI agora permite selecionar modo autoinstrucional ou híbrido (`instructor_led`); typecheck, Vitest e build passaram. Homologação autenticada de autoria/publicação continua pendente.
- Storage: `POST /api/v1/assets/[id]/complete` confirma a existência do objeto no bucket privado antes de promover `pending` para `ready`; typecheck, Vitest e build passaram. Não foi executado upload real com conta de homologação.

### Correção do convite — 27/10/2026

- `npm run typecheck`: PASS.
- `npm test`: **26 arquivos/53 testes PASS**.
- `npm run build`: PASS; a rota `/api/v1/invitations` foi compilada.
- Não foi executado envio real para Gmail; requer conta de homologação e deployment atualizado.

### T11 — editor de cursos — 27/10/2026

- `npm run test:e2e -- tests/e2e/course-authoring.spec.ts`: execução correta, **1 teste skipped** por ausência de `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` e `E2E_ORG_ID` não produtivos.
- O teste cobre login de gestor, entrada na gestão de cursos, formulário de criação e modo `self_paced`.
- A cobertura autenticada de criação, conteúdo e publicação permanece pendente.
- CI remoto no head `dbce0b205a2c3fd218985b7afb99802563e0fbdd`: web `40474451225` e SQL/pgTAP `40474451137`, ambos `success`.

### T14 — catálogo e biblioteca — 27/10/2026

- Criado `tests/e2e/student-catalog.spec.ts` cobrindo catálogo, busca de entrada e biblioteca do aluno.
- A execução autenticada requer `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` e `E2E_ORG_ID` não produtivos.
- CI remoto no head documental `c4b7bfdfd2c3aa4eebc82d3c6b3880915e2610d9`: web `40474826961` e SQL/pgTAP `40474826848`, ambos `success`.

### T15 — player e progresso — 27/10/2026

- Criado `tests/e2e/learning.spec.ts` para conteúdo, posição retomada e matrícula autenticada.
- O teste requer `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ORG_ID` e `E2E_ENROLLMENT_ID` não produtivos.

