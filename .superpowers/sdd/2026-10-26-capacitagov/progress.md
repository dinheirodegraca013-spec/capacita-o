# SDD ledger — plan: docs/rebuild/superpowers/plans/2026-10-26-capacitagov.md

Pre-flight: T01 produz a aplicação e os scripts consumidos por T02; T02 produzirá identidade/RLS consumidos por T03 e mutações posteriores. T25 é dependência implícita das mutações e deve ocorrer logo após T03.

Task 1: complete (tests: `npm test` → 1/1; `npm run typecheck` → 0; `npm run lint` → 0 erros; `npm run build` → rotas `/` e `/_not-found`)

Task 2: complete (migration `20261026212248_identity.sql`; PostgreSQL 18 WSL + pgTAP `14/14`; `npm test` 1/1; `npm run typecheck` 0; `npm run lint` 0 erros). O wrapper `supabase test db` permanece indisponível sem Docker, então a suíte foi executada diretamente no PostgreSQL local real.

Task 3: review — clientes Supabase SSR/browser/admin server-only, `requireActor`, endpoint `/api/v1/context` sem cache compartilhado e testes de 401/403; `identity.test.ts` cobre múltiplos papéis e rejeição cross-tenant; testes focados 5/5, typecheck/lint verdes. Produção confirmou `/api/v1/context` anônimo com HTTP 401 e `Cache-Control: no-store`. Falta somente jornada autenticada contra Auth/API Supabase real antes de DONE.

Task 25: complete (migration `20261026213618_audit.sql`; PostgreSQL 18 WSL + pgTAP `9/9`; audit service tests `2/2`; typecheck/lint verdes). Eventos só podem ser gravados pela fronteira interna e ficam tenant-scoped para leitura.

Task 4: running — login, recuperação, callback interno seguro, MFA administrativo e seleção de organização implementados; auth tests `2/2`, suite `8/8`, typecheck/lint/build verdes. Falta E2E contra um projeto Supabase com Auth configurado.

Task 5: running — migration de convites com idempotência por organização/e-mail, hash de token, expiração, RLS somente leitura e serviço de convite; invitation tests `2/2`, pgTAP `7/7`, suite `10/10`, typecheck/lint/build verdes. Falta E2E SMTP/Auth real.

Task 5 complemento: RPC `accept_invitation` e endpoint de ativação adicionados; valida email do JWT, expiração/hash, cria perfil/membership/roles e consome convite. pgTAP `4/4`, typecheck/lint/build verdes. Falta E2E com Supabase Auth/SMTP remoto.

Task 6: running — gestão de organização/unidades, função `is_org_manager`, policies de mutação no tenant, API PATCH e página de gestão; pgTAP `7/7`, suite `11/11`, typecheck/lint/build verdes. Falta E2E com dois tenants via API real.

Task 7: running — people/import_batches, validação de 500 linhas/2 MiB, normalização/deduplicação e API de preview; import tests `2/2`, pgTAP `7/7`, suite `13/13`, typecheck/lint/build verdes. Commit/convites pós-importação e E2E de lote ainda pendentes.

Task 7 complemento: endpoint transacional de commit grava `import_batches` como committed e faz upsert tenant-scoped em `people` via RPC `commit_people_import`, com rollback atômico, evento `people.import.committed` e pgTAP de função/commit/invalidação/auditoria preparado. Tela de gestão agora usa parser CSV com aspas, vírgulas, CRLF e cabeçalho opcional. Rota `/gestao` também foi criada para eliminar destino de menu quebrado. Testes web `45/45`, typecheck/lint/build verdes. Execução PostgreSQL desta nova migration aguarda ambiente local disponível; convites pós-importação e E2E remoto permanecem pendentes.

Task 8: running — PortalShell acessível, menus por papel, organização ativa, layout responsivo e rota institucional autorizada; navigation test `1/1`, suite `14/14`, typecheck/lint/build verdes. Playwright E2E ainda pendente.

Task 9: running — schema courses/course_versions/modules/lessons, RLS por tenant, publicação imutável e bloqueios de licença/conteúdo; courses tests `2/2`, pgTAP `9/9`, suite `16/16`, typecheck/lint/build verdes. Assets e E2E de autoria ainda pendentes.

Task 10: running — assets privados, bucket `course-assets` não público, MIME/tamanho limitados, policies Storage e URL assinada de 5 minutos; asset tests `1/1`, pgTAP `8/8`, suite `17/17`, typecheck/lint/build verdes. Falta validação de matrícula/asset pronto em API real.

Task 11: running — editor inicial de cursos próprios com criação de rascunho, cadastro de módulo/aula, publicação transacional licenciada e sem exigência de professor no modo autoinstrucional; pgTAP `6/6`, typecheck/lint/build verdes. Falta E2E com upload/conta de homologação e autoria central.

Task 12: running — catálogo central com concessão de versões para organizações e ofertas tenant-scoped (`course_grants`/`offerings`), regras de gerente/admin, rotas de grants/ofertas e validação de datas/capacidade; pgTAP `8/8`, unit suite `18/18`, typecheck/lint/build verdes. Falta E2E real e integração com matrícula.

Task 12 complemento: publicação de ofertas agora exige versão publicada e concessão ativa (`publish_offering`); tela de catálogo institucional e endpoint de publicação adicionados. pgTAP de publicação `3/3`, typecheck/lint/build verdes. Falta UI de concessão para plataforma e E2E remoto.

Task 13: running — matrículas com snapshot de regras, unicidade por oferta/membro, RLS e função transacional `enroll_member` com lock da oferta e limite de capacidade; pgTAP `9/9`, unit suite `20/20`, typecheck/lint/build verdes. Falta E2E real e cobertura de turmas/transferências.

Task 13 complemento: endpoint de transferência/atribuição de matrícula à turma adicionado; `assign_enrollment_to_class` valida organização e oferta, com pgTAP `3/3` cobrindo atribuição e rejeição cross-offer. Falta E2E remoto.

Task 14: running — catálogo e biblioteca do aluno com busca por título, estado vazio, ofertas publicadas tenant-scoped, matrícula via endpoint e lista de matrículas próprias; suíte web `20/20`, typecheck/lint/build verdes. Falta Playwright contra Auth/API reais.

Task 15: running — progresso persistente por matrícula/aula, posição monotônica, confirmação de leitura, limite de duração configurável, RLS e player retomável; pgTAP `8/8`, unit suite `22/22`, typecheck/lint/build verdes. Falta Playwright e mídia real.

Task 16: running — trilhas tenant-scoped, itens ordenados com pré-requisito e trigger anti-ciclo, assignments idempotentes e serviço de atribuição por gerente; pgTAP `6/6`, unit suite `24/24`, typecheck/lint/build verdes. Falta UI/E2E e validação de dependências em jornada real.

Task 16 complemento: APIs e tela de gestão de trilhas adicionadas, com criação de rascunho, etapas ordenadas, publicação bloqueada sem etapas e navegação de gestor. Falta atribuição de membros pela UI e E2E real.

Task 17: running — banco de questões com avaliações versionadas, opções corretas protegidas por RLS, parâmetros de nota/tentativas e publicação transacional validada; pgTAP `8/8`, unit suite `26/26`, typecheck/lint/build verdes. Falta UI de autoria, DTO seguro do aluno e E2E.

Task 17 complemento: UI/API de autoria de avaliação implementada para gestores, com criação atômica e auditada de avaliação/questões/opções via RPC protegida, limites de payload, publicação via função protegida e página institucional; testes web `46/46`, typecheck/lint verdes. Falta E2E e teste de API autenticada em homologação.

Task 18: running — tentativas com relógio/expiração no servidor, limite de tentativas, respostas validadas por questão/opção e finalização idempotente com cálculo de nota; pgTAP `10/10`, unit suite `28/28`, typecheck/lint/build verdes. Falta UI da sala, E2E e cobertura de expiração temporal real.

Task 19: running — sala retomável implementada com RPC seguro de entrega sem `is_correct`, endpoint de leitura, autosave de respostas, relógio derivado de `expires_at` do servidor e finalização; typecheck/lint/build verdes. Falta E2E com conta de homologação e cenário de expiração real.

Task 20: running — turmas, atribuições de instrutor e encontros com isolamento tenant-scoped, validação de instrutor ativo e janela temporal; pgTAP `6/6`, unit suite `30/30`, typecheck/lint/build verdes. Falta UI/E2E, matrícula em turma e chamada.

Task 20 complemento: APIs e tela de gestão de turmas/encontros adicionadas; matrícula agora pode ser vinculada explicitamente à turma pela migration `20261026220600_class_enrollment.sql`. Falta UI de atribuição de instrutor e E2E real.

Task 21: running — tokens de chamada aleatórios com hash, validade de cinco minutos, autorização de instrutor/gestor, presença idempotente e isolamento por matrícula/tenant; pgTAP `7/7`, unit suite `32/32`, typecheck/lint/build verdes. Falta UI/E2E, correções auditadas e integração da presença na conclusão.

Task 21 complemento: painel do professor para emitir código e tela do aluno para confirmar presença adicionados; confirmação agora exige matrícula vinculada à turma do encontro. pgTAP de turmas `6/6` e chamada `7/7` verdes após a alteração. Falta E2E em janela temporal real.

Task 22: running — avaliação transacional de requisitos, presença ponderada por minutos, bloqueio de encontros futuros, emissão de certificado única por matrícula e snapshots públicos; pgTAP `9/9`, unit suite `34/34`, typecheck/lint/build verdes. Falta PDF, verificação pública, cenários híbridos completos e E2E.

Task 23: running — verificação pública sanitizada, revogação autorizada com motivo, PDF imprimível mínimo e biblioteca de certificados do aluno; pgTAP `6/6`, unit suite `36/36`, typecheck/lint/build verdes. Falta validação visual/E2E e QR público.

Task 24: running — avaliação pós-conclusão única por matrícula, rating 1–5, comentário limitado, RLS tenant-scoped, serviço/API e componente de feedback; pgTAP `5/5`, unit suite `38/38`, typecheck/lint/build verdes. Falta E2E e agregação de satisfação nos relatórios.

Task 26: running — relatórios institucionais por período e versão de curso com contagens reais, horas concluídas e média de satisfação, funções protegidas por gestor e API; pgTAP `5/5`, unit suite `39/39`, typecheck/lint/build verdes. Falta UI, exportação e E2E.

Task 26 complemento: tela de relatório institucional por período e exportação CSV adicionadas, com API tenant-scoped, validação de intervalo e neutralização de fórmulas/escape de células; testes web `44/44`, typecheck/lint verdes. Falta E2E e validação com dados reais.

Task 27: running — outbox de notificações com chave idempotente, payload sem campos sensíveis, RPC executável por `authenticated`, status/retry metadata, worker interno protegido, backoff de até cinco tentativas e documentação SMTP; pgTAP preparado `6/6`, unit suite `42/42`, typecheck/lint/build verdes. Falta provedor autorizado e observabilidade de entrega.

Task 28: running — isolamento RLS sob role `authenticated` passou `4/4`; Playwright configurado e executado com 2 specs explicitamente skipped sem conta não produtiva. Falta executar jornadas reais com Auth/API/Storage de homologação e anexar evidências do navegador.

Task 28 complemento: Chromium instalado localmente; E2E com variáveis públicas do Supabase autorizado passou `3/3`, com landing, login e Storage sem sessão; 2 jornadas autenticadas seguem skipped sem credenciais de homologação. Falta RLS/API/Storage remoto autenticado e jornadas completas.

Task 29: running — runbook de release, recuperação e gates remotos documentados; consulta somente leitura confirmou Supabase ativo sem migrations e nenhum projeto Vercel. Não aplicar DDL/deploy sem autorização explícita.

Task 30: running — inventário LGPD, operação de conteúdo e critérios de liberação documentados. Falta revisão jurídica/independente, backup remoto ensaiado, homologação real e aprovação de release.

Task 4 complemento 27/10: criada a rota `/redefinir-senha`; recuperação agora trata erro do Supabase sem enumeração e permite atualizar senha após callback. Build local expõe a rota; E2E real permanece pendente por SMTP/Auth e deployment.

Task 5 complemento 27/10: formulário de convite adicionado à gestão da organização; endpoint agora usa `inviteUserByEmail` com callback interno para `/ativar-conta`, preservando o token somente no servidor. Teste de redirect `3/3`, suíte web `51/51`, typecheck e build PASS. E2E SMTP/Auth permanece pendente por configuração externa.

Retomada 27/10 — revisão independente: foram corrigidos os riscos de integridade cross-tenant em turmas/encontros/instrutores/memberships com a migration `20261027062000_tenant_composite_fks.sql`, aplicada remotamente e confirmada por consulta dos quatro constraints. `confirm_attendance` agora exige matrícula e membership ativos no mesmo tenant. A UI de catálogo de gestão também inclui cursos próprios da organização, além do catálogo central concedido. Ainda não há evidência suficiente para fechar T03/T28–T30: autenticação real de duas organizações, SMTP/worker, backup/rollback e auditoria final continuam pendentes.

Retomada 27/10 — performance/CI: o advisor remoto identificou uma FK composta sem índice em `instructor_assignments`; a migration `20261027063000_instructor_tenant_fk_index.sql` foi aplicada no Supabase e o alerta `unindexed_foreign_keys` desapareceu. CI remoto no commit `d5fed8d08c869e2952106c14b72f71ce76a30cec`: SQL run `40453740988` e web run `40453741060` concluíram com sucesso.

Retomada 27/10 — T29: adicionado `apps/web/tests/e2e/preview.spec.ts`; contra o domínio de produção, rota profunda e fronteira de contexto passaram **2/2**. O teste confirma ausência de 404 e rejeição anônima sem cache compartilhado, sem criar preview com dados de produção.

Verificação posterior: typecheck, lint e Vitest web passaram localmente (25 arquivos/49 testes); CI remoto do commit `197306016ddc93a12e2532635739cb68886e5952` concluiu web run `40454007152` e SQL run `40454007330` com `success`.

Configuração operacional: `.env.example` passou a marcar variáveis server-only; no commit remoto `a99883adeb331c4c1c5d6ab113ad1c09b7a8a657`, web job `122023657349` e pgTAP job `122023657846` concluíram com sucesso.

Segurança de dependências: `npm audit --audit-level=high` está limpo após Playwright `1.55.1` e Vite `7.3.7`; testes web `46/46`, typecheck, lint e build continuam verdes.

Regressão SQL: os 24 arquivos em `supabase/tests/` passaram em sequência no PostgreSQL 18 local, incluindo novas fronteiras de oferta e matrícula em turma.

Retomada 27/10: a primeira execução revelou que `20261007_init.sql` era legado incompatível com a reconstrução; ele foi preservado em `supabase/legacy/` e removido da cadeia executável conforme o desenho. Instância PostgreSQL 18.6 temporária e isolada foi criada no WSL; migrations novas aplicaram sem erro e `pg_prove` passou `25` arquivos/`183` testes. Um fixture de importação foi corrigido para preparar dados sob a role proprietária antes de voltar à role `authenticated`. Suíte web revalidada: `npm test -- --run` 46/46, typecheck, lint e build concluídos com sucesso; build gerou 28 rotas.

Retomada 27/10 — T03: o repositório de identidade ganhou testes focados para retorno de papéis válidos e isolamento da organização selecionada. Resultado: 2 arquivos/5 testes PASS, typecheck e lint PASS. O endpoint público `/api/v1/context` do deployment atual retornou HTTP 401 com `Cache-Control: no-store`; a prova autenticada continua pendente por limite de envio de e-mail do Supabase.

Homologação Supabase autorizada em 27/10: as 28 migrations novas foram aplicadas ao projeto `zykfvzvydvifuzepujvv` em sequência, sem tocar dados de usuários. A auditoria posterior encontrou execução anônima indevida de funções `SECURITY DEFINER`; as migrations `20261027010000_harden_security_definer.sql`, `20261027010001_attendance_tokens_policy.sql` e `20261027010002_harden_function_search_path.sql` corrigiram privilégios, política explícita de tokens e search_path mutável. Regressão local final: `27` arquivos/`188` testes pgTAP PASS. Advisors Supabase agora mostram somente `verify_certificate` como SECURITY DEFINER público intencional e avisos de funções autenticadas/performance para revisão posterior.

Push autorizado para disparar CI: falhou antes de enviar porque o credential Git local usa `Cabanas01` sem permissão no repositório `dinheirodegraca013-spec/capacita-o` (HTTP 403). Não houve push parcial nem alteração remota no GitHub.

Validação do deployment informado pelo usuário (`https://capacita-o-x5hg.vercel.app`): raiz HTTP 200 com título CapacitaGov, porém a jornada pública `/login` retorna `404: NOT_FOUND`; Playwright remoto resultou `1 failed, 2 skipped`. Evidência indica que a URL atual aponta para outro build/configuração, não para a reconstrução Next em `apps/web`.

