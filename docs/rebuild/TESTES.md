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

