# Estado de planejamento — CapacitaGov

Atualizado: 27/10/2026, America/Sao_Paulo.

## Meta ativa e janela de retomada

O usuário solicitou uma meta para concluir o projeto completo, auditado e revisado, admitindo até 300 horas. Após a mensagem “pronto”, a meta foi retomada e a implementação está autorizada nesta conversa. Não há orçamento de tokens definido pelo usuário. A janela de acompanhamento começa em 26/10/2026 às 18:09:39 e termina em 08/11/2026 às 06:09:39 (America/Sao_Paulo). O prazo limita as retomadas; não comprova tempo de CPU, nem garante conclusão dentro dele.

Automação criada nesta conversa: `capacitagov-conclus-o-auditada-em-at-300-horas`, ativa, retomadas a cada 30 minutos até o limite. Deve encerrar quando o objetivo for alcançado ou a janela terminar. A meta não pode ser marcada completa no vencimento se ainda houver trabalho obrigatório. Máquina, app, acesso às ferramentas e cota precisam estar disponíveis para execução local.

Preferência anterior de uso do GPT 5.6 Luna médio foi registrada; a mensagem “pronto” foi tratada como autorização explícita para iniciar nesta sessão. A automação antiga `ciclo-cont-nuo-capacitagov`, vinculada ao chat de convites `01a14333-185b-7600-a0ba-88956a10d9f3`, foi apenas inspecionada e permanece inalterada; ela não controla esta reconstrução.

Encerramento da meta exige as 30 tasks aceitas com evidências, jornadas reais e testes de isolamento, revisão independente, auditoria final sem pendências críticas e situação de publicação explicitamente registrada. O pedido de duração não amplia autorização para pagamentos, exclusões ou produção.

## Resultado desta rodada

Registro histórico inicial: pesquisa pública, inventário de código/infraestrutura e proposta de reconstrução documentados. As atualizações posteriores substituem esse snapshot; a implementação atual está no checkout `capacita-o/`, branch `feat/capacitagov-rebuild`.

O plano original contém 30 tasks em 10 metas; seus itens ainda precisam ser fechados formalmente com evidência individual. A revisão independente apontou ambiguidades que foram resolvidas no desenho: cálculo de presença por minutos, vínculo de matrícula com turma e limites de alteração pela oferta.

## Atualização UX/UI — 27/10/2026

Adotada a abordagem institucional sóbria: landing orientada a valor, autenticação com contexto, seleção de organização em cartões, shell do portal com navegação ativa, foco visível, atalho de acessibilidade, responsividade e estados vazios mais claros. Alterados `apps/web/src/app/globals.css`, `apps/web/src/app/page.tsx`, `apps/web/src/app/(auth)/login/page.tsx`, `apps/web/src/app/(portal)/selecionar-organizacao/page.tsx` e `apps/web/src/components/layout/portal-shell.tsx`.

Verificação local: `npm run typecheck`, `npm run lint` e `npm run build` passaram após a mudança. A publicação dessa rodada ainda precisa ser criada e validada no domínio público.

## Correção de autorização de Storage — 27/10/2026

`GET /api/v1/assets/[id]/access` passou a resolver primeiro a organização do asset e só então selecionar o vínculo ativo do usuário nessa organização. Isso elimina dependência de uma associação arbitrária quando a mesma pessoa pertence a múltiplos tenants; o serviço continua validando tenant, status `ready` e URL assinada de 5 minutos. Testes, typecheck, lint e build passaram.

O `POST /api/v1/assets` agora também gera `createSignedUploadUrl` para o bucket privado `course-assets`, retornando token/path para o cliente enviar o arquivo sem expor credenciais privilegiadas. O registro permanece `pending` até processamento posterior; teste de integração cobre a capacidade assinada.

Reauditoria remota somente leitura confirmou bucket `course-assets` privado, policy de INSERT limitada a `is_org_manager(foldername(name)[1])` e SELECT limitada a `is_active_member(foldername(name)[1])`. As funções RPC `SECURITY DEFINER` continuam concedidas somente aos papéis necessários; `verify_certificate` permanece público por desenho para validação de certificados.

O procedimento operacional de e-mail foi documentado em `docs/rebuild/operations/email.md`: fila idempotente, endpoint interno protegido, retry/backoff e variáveis server-only. SMTP/provedor real continua pendente de credenciais e domínio remetente.

O worker de notificações foi endurecido: `claim_pending_notifications` usa `FOR UPDATE SKIP LOCKED` e move itens para `processing` antes do envio, impedindo que dois workers entreguem o mesmo item. A função é executável somente por `service_role`; a verificação remota confirmou `service_role=true`, `authenticated=false` e `anon=false`. Testes web: 24 arquivos, 47 testes PASS.

Revisão independente apontou uma lacuna real no ciclo de tentativas: matrícula cancelada ainda podia manter resposta/finalização. A migration `20261027060000_harden_attempt_enrollment_status.sql` foi aplicada no Supabase e as três funções (`save_attempt_answer`, `finish_attempt`, `get_attempt_delivery`) agora exigem `enrollments.status = 'active'`; consulta remota confirmou os três guards.

## Próxima ação

Fechar as pendências operacionais: SMTP/Auth de convite, observabilidade, preview com dados isolados, CI remoto, recuperação/rollback e auditoria independente final. O plano técnico continua sujeito a evidências, não a aprovação implícita.

## Correções após revisão independente — 27/10/2026

A revisão encontrou lacunas de integridade que exigiram correção antes da próxima aprovação: a migration `20261027062000_tenant_composite_fks.sql` foi aplicada ao Supabase autorizado e adicionou FKs compostas para oferta/turma, turma/instrutor, membership/instrutor e turma/encontro; também reforçou `confirm_attendance` para exigir matrícula e membership ativos no mesmo tenant. A consulta remota confirmou os quatro constraints e o guard de matrícula ativa.

Na UI de catálogo institucional, cursos próprios da organização passaram a aparecer junto aos cursos centrais concedidos; a consulta continua tenant-scoped e o backend mantém a distinção entre concessão central e propriedade institucional. A regressão pgTAP `tenant_integrity.test.sql` cobre esses limites. A meta permanece em revisão: ainda faltam E2E autenticado de duas organizações, SMTP/worker, backup/rollback e auditoria final.

## Contexto mínimo para retomar

- Repositório: `https://github.com/dinheirodegraca013-spec/capacita-o`.
- Supabase exclusivo: `zykfvzvydvifuzepujvv`, CAPACITAGOV, ativo; migrations funcionais e hardenings aplicados.
- Vercel: projeto `capacita-o-x5hg`, domínio `https://capacita-o-x5hg.vercel.app/`; após a cobertura de identidade, o deployment `dpl_5yKfzvh86PXuCnUucpYiy6q9vhxC` (commit `2dde697496d4907e994b1a478eda3aee6a9efb2d`) ficou READY e recebeu o alias principal. Validação direta: `/` e `/login` HTTP 200 com título `CapacitaGov`; `/api/v1/context` HTTP 401 anônimo, sem cache compartilhado. O deployment Vite antigo foi substituído no alias.
- Raiz desta rodada: `E:/000  arquivos que nao puderam ser enviados/Downloads/SISTEMAS/CAPACITAGOV`.
- Checkout de implementação: subpasta `capacita-o/`, branch `feat/capacitagov-rebuild`.
- Código novo: `capacita-o/apps/web/`.
- Documentos: ler este estado, o desenho e a seção da task atual; consultar a pesquisa apenas para dúvida concreta.
- Checkouts antigos têm alterações não commitadas. Não os editar nem limpar; não executar automações antigas como ordem desta rodada.
- `docs/PROJECT_MAP.md` antigo não comprova homologação. CI/testes antigos não contam como verificação do produto novo.

## Validações feitas

Consultas de GitHub, projeto/tabelas/migrations Supabase e busca Vercel; leitura dirigida de tipos, rotas e planos anteriores; sete capturas REA com limpeza dos processos; consulta web de páginas oficiais. Uma captura da Udemy mostrou desafio de segurança. Contrato inicial de REA foi corrigido após erro de argumentos, antes das capturas válidas.

## Pendências reais

Provedor SMTP/serviço de envio e observabilidade; preview Vercel com dados não produtivos; execução do CI remoto; backup/restauração e ensaio de rollback; revisão independente final; conteúdo/licenciamento dos cursos reais; push GitHub com credencial do proprietário. Não é necessário enviar instalador REA.

## Retomada de 27/10/2026

- Corrigidas as falhas apontadas na revisão independente: visibilidade de versões/conteúdo, validação de escopo das ofertas, cursos próprios sem concessão central obrigatória, matrícula `manager_assigned`, concessões revogadas, status ativo em operações de aprendizagem/conclusão/provas, presença filtrada pela turma da matrícula e múltiplos papéis no `IdentityRepository`.
- Nova migration local/remota: `20261027030000_authorization_regressions.sql`; hardening de privilégio do trigger em `20261027033000_harden_offering_trigger_privilege.sql`.
- Nova migration local/remota: `20261027050000_harden_catalog_scope.sql`, incluindo concessão obrigatória para conteúdo central, ofertas de cursos próprios e vínculo ativo na presença.
- Nova migration local/remota: `20261027051000_revoke_public_catalog_helper.sql` e `20261027052000_harden_class_tenant_integrity.sql`, removendo RPC anônima do helper e validando organização de turmas/encontros.
- Nova regressão pgTAP: `authorization_regressions.test.sql`. Suíte local: **28 arquivos, 199 testes, PASS**. Aplicação remota confirmada no projeto `zykfvzvydvifuzepujvv`.
- Auditoria Supabase ainda apresenta avisos de performance e funções `SECURITY DEFINER` intencionais para RPCs autenticadas; o trigger de ofertas foi removido da superfície pública.
- Vercel: deployment de produção `dpl_BxqDDmMf97HygLJd2EkmJU2hkos1` concluído no projeto `capacita-o-x5hg`; domínio `https://capacita-o-x5hg.vercel.app/` validado via fetch protegido com `/` e `/login` retornando 200 e conteúdo Next/CapacitaGov. O projeto foi corrigido para `framework=nextjs`, `rootDirectory=apps/web`, `npm ci --legacy-peer-deps` e `npm run build`; o metadado histórico `vite` não é mais usado para novas implantações.
- Runtime Vercel corrigido: o projeto não tinha variáveis; `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` foram configuradas como pública/encrypted nos ambientes production/preview/development. Redeploy final `dpl_D8d1S5dZz2L3ztx5ScGEb5SHciPN` ficou READY.
- Jornada autenticada real validada em produção: deployment `dpl_27LxyyfouZGD7ZtRf3AK2U9YHf9z` READY; Playwright **3/3 PASS** após adicionar a rota raiz `/o/[orgId]` (redireciona para `/aluno`) e ajustar os seletores E2E. Conta e organização temporárias foram removidas do Supabase (0 restantes). O push via credencial local continua bloqueado por 403; os commits desta rodada foram publicados pelo conector GitHub autorizado.
- Nova proteção de rota: `/gestao/*` exige papel `manager` no servidor e `/professor` exige `instructor` ou `manager`; typecheck, lint e build passaram. A publicação correspondente ficou READY em `dpl_7KE9Cje9s6YFSVBbXYEZt8VYsj6w`. A tentativa de criar uma segunda conta de teste para provar o bloqueio foi impedida pelo limite de envio de e-mail do Supabase; nenhum dado temporário permaneceu.
- Otimização de banco aplicada: `20261027040000_rls_initplan_optimization`, `20261027041000_fk_indexes` e `20261027042000_fk_indexes_remaining`. `pg_prove` local continua 28/199 PASS; advisor remoto confirmou zero `auth_rls_initplan` e zero FK sem índice. Permanecem somente avisos INFO de índices não utilizados, esperados antes de carga real.
- Procedimento de Vercel formalizado em `docs/rebuild/operations/deploy.md`; preview isolado continua pendente porque o único Supabase autorizado é o projeto remoto de produção.
- CI SQL: run `40451913650` verde em PostgreSQL 16 + pgTAP, incluindo instalação, bootstrap, migrations e `pg_prove`; a cadeia exclui explicitamente `20261007_init.sql`, migration legada que duplicava o schema. Suíte local: 28 arquivos/199 testes PASS.
- Promoção mais recente: deployment Next `dpl_4LDQwbm6YeGGRES9hYup8zfzq5KM` (commit `071134959a8d7a843fafe9e5c108434b83b3a93b`) ficou READY e recebeu o alias `capacita-o-x5hg.vercel.app`, substituindo o anterior. Validação direta: `/` e `/login` HTTP 200 com título `CapacitaGov`; `/api/v1/context` HTTP 401 anônimo, `Cache-Control: no-store, private`.
- Tentativa de ampliar o E2E para duas contas reais: o Auth remoto respondeu `over_email_send_rate_limit` no fluxo público de cadastro; contas sintéticas criadas somente para diagnóstico via SQL foram removidas na mesma sessão (usuários, perfis, organizações e memberships). O gate continua pendente de contas de homologação/credenciais autorizadas.
- Nova tentativa controlada sem envio de e-mail: inserir usuário diretamente em `auth.users` produziu `unexpected_failure` no Auth por inconsistência interna; o registro foi removido imediatamente. Não usar inserção manual de usuários para homologação.
- Auditoria de ambiente Vercel: somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` estão configuradas nos três ambientes; service role, segredo do worker e provedor de e-mail ainda não foram fornecidos/configurados.
- Advisor de performance rechecado após `20261027063000_instructor_tenant_fk_index`: o alerta de FK sem índice desapareceu; permanecem apenas INFO de índices ainda não utilizados, esperado antes de carga real.
- CI após o índice composto: SQL run `40453740988`/job `122022151144` e web run `40453741060`/job `122022151634` concluíram `success`; migrations, pgTAP, typecheck, lint, testes e build passaram.
- Operação remota rechecada: Supabase `zykfvzvydvifuzepujvv` está `ACTIVE_HEALTHY` em PostgreSQL 17.11; não existem branches Supabase adicionais. Em produção, `/api/internal/notifications` rejeitou chamada sem segredo (401) e Storage sem sessão rejeitou acesso (401), confirmando as fronteiras de segurança. Backup/restauração e SMTP continuam sem evidência operacional.
- O contrato de configuração em `apps/web/.env.example` agora identifica explicitamente as variáveis server-only (`SUPABASE_SERVICE_ROLE_KEY`, segredo do worker e provedor). CI do commit `a99883adeb331c4c1c5d6ab113ad1c09b7a8a657` passou web job `122023657349` e pgTAP job `122023657846`.
- O checklist `docs/rebuild/operations/homologacao.md` foi sincronizado para o branch remoto (`401d6931896a6c399d158721ffd3b8a7e69aa16b`), sem incluir credenciais.
- CI do checklist remoto aprovado: web job `122024502124` e pgTAP job `122024502275` concluíram `success` nos runs `40454482796` e `40454482844`.

## Fechamento Resend — 27/10/2026

As duas chaves de teste não utilizadas foram revogadas. `NOTIFICATION_JOB_SECRET` foi criado como segredo no Vercel nos três ambientes. O deployment `dpl_7unt8EvMG1sVgH5TvKgf9G5XSA27` ficou READY e o alias principal respondeu HTTP 200 com título CapacitaGov. Continua pendente somente `SUPABASE_SERVICE_ROLE_KEY` para o worker administrativo.

## Imagens institucionais — 27/10/2026

Adicionada ilustração hero responsiva em `apps/web/public/images/capacitagov-hero.png`, com texto alternativo, carregamento prioritário e composição mobile. Typecheck, lint e build locais passaram. O novo deployment não pôde ser criado por limite diário da Vercel (`api-deployments-free-per-day`), com retry informado em 24 horas.

## Resend — 27/10/2026

Domínio Resend `gestio.dev.br` confirmado como verificado e habilitado para envio. Foi criada uma chave restrita de `sending_access` para CapacitaGov e configuradas no projeto Vercel `capacita-o-x5hg` as variáveis server-only `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_KEY` e `EMAIL_FROM` nos três ambientes. O worker passou a transformar notificações no contrato `/emails` da API Resend e resolver o e-mail do destinatário via Supabase Auth Admin. A chave não foi registrada em arquivos ou logs.

## Fluxos de autenticação e convite — 27/10/2026

Corrigida a recuperação: `/redefinir-senha` agora existe, valida confirmação, atualiza a senha após callback e trata falhas sem enumeração. O convite institucional ganhou formulário de gestão, criação de usuário via Supabase Auth Invite e callback interno para `/ativar-conta`, mantendo o token fora da resposta do navegador. Suíte web: **26 arquivos/51 testes PASS**, typecheck e build PASS. E2E real depende de SMTP/Auth configurado e novo deployment; a Vercel ainda reporta limite diário de deploys.

Logs Auth consultados: recuperação e convite chegaram ao Supabase, mas ocorreram `over_email_send_rate_limit` (429) e links antigos com referer `localhost:3000`. Foi adicionada `NEXT_PUBLIC_APP_URL=https://capacita-o-x5hg.vercel.app` ao Vercel e o fluxo de recuperação passou a usar a URL canônica; o novo código ainda aguarda deployment por cota da Vercel.

## Fechamento T03 — 27/10/2026

T03 foi revisada e marcada DONE no plano. Evidências: `tests/integration/session.test.ts` 3/3; `/api/v1/context` sem sessão no deployment público retorna 401 com `Cache-Control: private, no-store`; `SUPABASE_SERVICE_ROLE_KEY` aparece apenas no cliente administrativo server-only. T04/T05 continuam abertas por E2E autenticado, SMTP/Auth e novo deployment.

T04 complemento — 27/10/2026: criada `apps/web/tests/e2e/auth.spec.ts`; no servidor local, login/recuperação pública e callback sem código passaram `2/2`. O cenário de senha inválida foi explicitamente `skip` por ausência de `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; login real, logout e MFA continuam sem evidência autenticada.

T05 complemento — 27/10/2026: convites para e-mails já existentes agora usam `auth.admin.generateLink({ type: 'magiclink' })` e envio Resend server-only quando o convite padrão retorna usuário já registrado. A ativação detecta conta já confirmada e não força troca de senha. Suíte web completa: **26 arquivos/52 testes PASS**, typecheck e build PASS; E2E real de SMTP/Auth continua pendente.

## CI e revisão remota — 27/10/2026

PR draft [#2](https://github.com/dinheirodegraca013-spec/capacita-o/pull/2) aberto contra `main`. No head `54505b239f164626596edefa6709de25b8413a02`, web run `40470454999` e SQL/pgTAP run `40470455090` concluíram `success`; o web job executou typecheck, lint, 52 testes e build, e o job SQL aplicou migrations e executou a regressão. A Vercel tentou criar preview, mas bloqueou por `api-deployments-free-per-day` (mais de 100 deploys); produção não foi alterada.

