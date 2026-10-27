# Homologação e evidências

## Executado

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

## Ainda não executado

- `supabase test db` via wrapper oficial: ambiente Docker indisponível; os scripts SQL foram executados diretamente no PostgreSQL local.
- Playwright local: `1 passed, 2 skipped` no baseline. Após corrigir a rota raiz da organização e os seletores do roteiro, Playwright contra a produção `https://capacita-o-x5hg.vercel.app/`: **3/3 PASS** (login público, jornada autoinstrucional e jornada híbrida com conta temporária real). A conta/organização de teste foi removida após a execução; contagem remanescente no Supabase: 0/0.
- Supabase remoto: migrations funcionais/hardening/otimização aplicadas e advisors rechecados; Vercel produção validada no deployment `dpl_7KE9Cje9s6YFSVBbXYEZt8VYsj6w` após as correções de rota e autorização.
- As migrations `20261026220900_import_commit.sql`, `20261026221000_assessment_authoring_atomic.sql` e `20261026221100_notifications_grant.sql` foram aplicadas remotamente e passaram no conjunto pgTAP; seguem pendentes somente as validações operacionais de SMTP/worker.
- O workflow `.github/workflows/sql-regression.yml` foi preparado para executar a mesma sequência em PostgreSQL 16 + pgTAP no GitHub Actions, usando `pg_prove` para falhar corretamente em qualquer asserção `not ok`; ele ainda depende de uma execução do CI após o push/autorização correspondente.

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

