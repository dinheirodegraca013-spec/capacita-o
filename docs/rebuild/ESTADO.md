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

Após os registros finais no branch, o head `b871f7c98b3e7a2d8dec8558f4823b48390a71b4` foi revalidado: web run `40470617197` e SQL/pgTAP run `40470617027` concluíram `success`, incluindo build e aplicação completa das migrations.

## T06 — gestão institucional — 27/10/2026

A gestão ganhou formulário de edição de nome/fuso e cadastro de unidades. `PATCH`/`POST /api/v1/organizations/[orgId]` exigem membership ativo com papel `manager` antes da operação, além do RLS. Suíte web: **26 arquivos/53 testes PASS**, typecheck, lint e build PASS. E2E cross-tenant continua pendente.

## T07 — importação transacional — 27/10/2026

O importador passou a ter duas etapas reais: validação/preview via `/api/v1/imports`, erros por linha e confirmação explícita via `/api/v1/imports/commit`; o servidor revalida o lote antes da transação. Testes de importação `3/3`, suíte web **26 arquivos/53 testes PASS**, typecheck, lint e build PASS. Convites pós-importação e E2E autenticado permanecem pendentes.

Correção de sincronização remota — 27/10/2026: uma atualização via API do GitHub gravou a mensagem de erro do PowerShell em dois caminhos contendo `[orgId]`; o CI detectou a falha de typecheck. Os arquivos foram reenviados com leitura literal. No head `04919470b8eeae84bb8a6f20660bdd88780280f7`, web run `40471248105` e SQL/pgTAP run `40471248124` concluíram `success`.

## Correção do callback de convite — 27/10/2026

O callback agora aceita tanto `code` quanto `token_hash` (`invite`, `magiclink` e `recovery`), evitando que o botão do e-mail termine em `/login?error=callback` sem processar o convite. A rota de convite usa `NEXT_PUBLIC_APP_URL` como origem canônica, e o formulário mostra conflitos/erros retornados pela API. Typecheck, suíte Vitest (**26 arquivos/53 testes**) e E2E público (**2 pass, 2 skip por ausência de Supabase público**) passaram localmente. No head remoto `0079bb4ded96cfc5806ec300cc993077a1d78923`, web run `40471969023` e SQL/pgTAP run `40471968979` concluíram `success`. A produção ainda não recebeu o código por limite diário de deployments da Vercel.

## T08 — navegação responsiva — 27/10/2026

Adicionado `tests/e2e/navigation.spec.ts` cobrindo login em viewport de 360px, foco via teclado, ausência de overflow horizontal e fronteira de rota institucional sem sessão. Localmente: 1 teste passou e 1 foi omitido por ausência das variáveis públicas do Supabase. CI remoto no head `c74018dcd4e4507dd974e02245d791a93ecdc2b3`: web run `40472324677` e SQL/pgTAP run `40472324553` concluíram `success`. O teste autenticado de navegação multi-organização continua pendente.

## T12 — ofertas para todas as versões disponíveis — 27/10/2026

Corrigida a tela de catálogo institucional: o gestor agora recebe uma forma de criar oferta para cada versão publicada disponível (catálogo central concedido e cursos próprios), com rótulos/IDs acessíveis únicos. Antes, somente a primeira versão podia ser ofertada. Typecheck, Vitest (**26 arquivos/53 testes**) e build passaram localmente; CI remoto no head `48e3c69b3ae44c4c3964a66f12caf8e818d49692` (web `40472604392`, SQL/pgTAP `40472604390`) concluiu `success`. A homologação autenticada de concessão/oferta ainda está pendente.

## Auditoria intermediária — 27/10/2026

Parecer **BLOCKED para liberação integral**, sem marcar a meta como concluída. O código e o CI permanecem verdes, mas continuam pendentes E2E autenticado de dois tenants, SMTP/worker real, backup/restauração/rollback e preview Vercel do HEAD. A cota `api-deployments-free-per-day` segue retornando HTTP 402; produção não foi alterada.

T07 complemento — o pós-commit da importação agora dispara convites de aluno pelo endpoint institucional em lotes de cinco, contabilizando falhas sem desfazer a importação já confirmada. Typecheck, Vitest (**26 arquivos/53 testes**) e build passaram; o teste operacional de e-mail continua pendente.

T07 idempotência — 27/10/2026: a confirmação agora deriva uma chave SHA-256 estável do lote e do tamanho, com índice único por organização. A RPC de quatro argumentos retorna o lote existente em repetição e, após migration incremental `20261027091000_import_idempotency_concurrency.sql`, evita reprocessamento/auditoria duplicados em concorrência. A rota e o wrapper legado permanecem compatíveis. Suíte web **27 arquivos/66 testes PASS**, typecheck e lint PASS; Supabase confirmou a função SECURITY DEFINER, execução negada a `anon`, permitida a `authenticated` e conflito seguro.

T08 correção de sessão — 27/10/2026: o botão “Sair” apontava para `/auth/signout`, mas a rota não existia. Criada rota POST server-side que chama `supabase.auth.signOut()` e responde 303 para `/login`. Suíte web **27 arquivos/66 testes PASS**, typecheck, lint e build PASS; build expõe `/auth/signout` como rota dinâmica.

Teste de regressão do logout — 27/10/2026: adicionado `tests/integration/signout.test.ts`, com mock do cliente server-side, verificando `signOut()` e redirecionamento 303. O Vitest passou **28 arquivos/67 testes**, com typecheck e lint PASS.

Validação pública — `POST https://capacita-o-x5hg.vercel.app/auth/signout` retornou **404** no deployment antigo; o endpoint corrigido só poderá ser confirmado após novo deployment Vercel.

Rechecagem Vercel — 27/10/2026 07:06: o alias `capacita-o-x5hg.vercel.app` aponta para `dpl_3ck2DvwQZQ8uoKNisi3CymyZco2S`, commit `db81004f3392d85524f066a5a1701854787bcbc9` (TOTP). O HEAD com logout, recuperação e idempotência permanece fora da produção; as tentativas de deployment manual continuam sujeitas à cota `api-deployments-free-per-day`.

Suíte pública Playwright — 27/10/2026 07:11: **5 passed, 22 skipped**. Passaram login/recuperação, callback sem código, landing híbrida e navegação responsiva em 360px; os skips exigem ambiente Supabase público, conta, matrícula ou organização de homologação. Nenhum cenário público falhou.

Auditoria Supabase somente leitura — 27/10/2026: **34/35** tabelas públicas estão com RLS habilitado; a exceção é `notification_outbox`, deliberadamente service-only e sem grants para `anon`/`authenticated`. O bucket `course-assets` está privado. O conjunto público possui políticas RLS nas tabelas de domínio; jornadas cross-tenant autenticadas continuam pendentes por ausência de fixtures não produtivas.

Hardening de convite — 27/10/2026: `/ativar-conta` captura o token uma única vez e o remove da barra de endereço via `history.replaceState`, mantendo-o somente em memória até a chamada de aceitação. A regressão Playwright foi ajustada para confirmar a URL limpa; typecheck e lint PASS. A entrega real continua dependente do deployment atualizado.

RLS cross-tenant real — 27/10/2026: em transação temporária no Supabase autorizado foram criados dois usuários, duas organizações e dois memberships; sob o papel `authenticated`, cada claim JWT consultou exatamente **1 organização e 1 membership**. A transação terminou com `ROLLBACK`, sem dados persistentes. Esta evidência cobre leitura tenant-scoped; jornadas browser autenticadas e Storage ainda dependem de contas de homologação.

RLS de escrita — na mesma abordagem transacional, um gestor do tenant A teve **0 linhas** ao tentar atualizar a organização B e a inserção de unidade em B foi negada (`cross_org_insert_allowed=0`); rollback confirmado.

Homologação real de recuperação — 27/10/2026 07:17: o endpoint Auth `/recover` respondeu HTTP 200 para o endereço de homologação e os logs `auth_logs` registraram `mail.send`, `mail_type=recovery`, com remetente nativo Supabase e destinatário confirmado. O redirect solicitado foi `/redefinir-senha`; a validação de clique ainda depende do deployment público atualizado e da confirmação na caixa de entrada.

Storage privado — verificação direta em 27/10/2026: requisição anônima ao objeto inexistente em `course-assets` retornou HTTP **400**, sem entrega de conteúdo. O bucket permanece `public=false`; autorização de arquivo real para matrícula ainda requer fixture autenticada.

Rechecagem de ambiente Vercel — `filter_project_envs` confirmou `SUPABASE_SERVICE_ROLE_KEY` como variável sensível nos três ambientes, além de `NEXT_PUBLIC_SUPABASE_URL`, chave publicável e variáveis Resend (`EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_KEY`, `EMAIL_FROM`). O conector não revela valores secretos; não há base para declarar a chave ausente. O deployment público continua defasado do HEAD.

Correção do reset de senha — 27/10/2026: `recuperar-senha` agora aponta diretamente para `/redefinir-senha`; a página consome `code`, `token_hash` ou a sessão entregue no fragmento antes de habilitar a nova senha. Typecheck, lint, build e suíte Vitest **28 arquivos/67 testes PASS**. A confirmação pública e o recebimento real do e-mail continuam dependentes do novo deployment/SMTP.

T09/T11 complemento — o formulário de criação de curso próprio agora permite escolher `self_paced` (autoinstrucional, sem professor) ou `instructor_led` (jornada híbrida). O backend já persistia o modo; a UI deixou de forçar somente autoinstrucional. Typecheck, Vitest (**26 arquivos/53 testes**) e build passaram localmente.

T10 complemento — adicionada `POST /api/v1/assets/[id]/complete`: somente gestor do tenant pode confirmar o upload, e o servidor consulta o bucket privado `course-assets` antes de alterar o asset de `pending` para `ready`. Sem objeto confirmado, a API retorna conflito e não libera URL assinada. Typecheck, Vitest (**26 arquivos/53 testes**) e build passaram; teste operacional com arquivo real permanece pendente.

## Correção do botão de convite — 27/10/2026

O endpoint de convite deixou de depender do remetente nativo do Supabase Auth, que podia criar o convite sem entregar um botão utilizável quando o SMTP/Auth estava indisponível ou limitado. Agora ele gera o action link do Supabase (`invite`, com fallback `magiclink` para contas existentes) e sempre o entrega pelo Resend configurado; falhas marcam o convite como `failed` e retornam erro explícito à interface. Typecheck, Vitest (**26 arquivos/53 testes**) e build passaram. Envio real e publicação do HEAD continuam pendentes por homologação SMTP e limite da Vercel.

## T11 — editor de cursos e publicação — 27/10/2026

O editor agora exibe módulos/aulas já persistidos, permite cadastrar conteúdo textual da aula, apresenta feedback de salvamento/publicação e impede publicação na interface sem módulo. A API rejeita aulas sem título antes de gravar. Foi criado `tests/e2e/course-authoring.spec.ts`, condicionado a uma conta de gestor e organização não produtivas. Typecheck, 53 testes Vitest, build e execução E2E (1 teste skipped por ausência de credenciais) passaram. A jornada autenticada real ainda é necessária para marcar T11 como DONE.

CI remoto do head `dbce0b205a2c3fd218985b7afb99802563e0fbdd`: web run `40474451225` e SQL/pgTAP run `40474451137`, ambos `success`.

## T14 — catálogo e biblioteca do aluno — 27/10/2026

O cartão de oferta agora informa início, prazo e capacidade quando definidos, mantém a política de matrícula explícita e comunica falha de inscrição com alerta acessível. Foi criado `tests/e2e/student-catalog.spec.ts` para catálogo e biblioteca, condicionado a conta de aluno não produtiva. Typecheck, Vitest, build e execução E2E serão registrados após a validação deste ciclo; homologação autenticada continua pendente.

CI remoto do head documental `c4b7bfdfd2c3aa4eebc82d3c6b3880915e2610d9`: web run `40474826961` e SQL/pgTAP run `40474826848`, ambos `success`.

## T15 — player e progresso persistente — 27/10/2026

O player passou a carregar e exibir o conteúdo textual da aula, permitir salvar posição em segundos e marcar a aula como concluída sem perder a retomada. O RPC existente mantém monotonicidade/idempotência e rejeita posições impossíveis. Foi criado `tests/e2e/learning.spec.ts`, condicionado a matrícula de homologação. A jornada autenticada real continua pendente.

CI remoto do head documental `83ae989c390ff7568b3507a6ca041850ab68dc27`: web run `40475154744` e SQL/pgTAP run `40475154694`, ambos `success`.

## T16 — trilhas e obrigatoriedades — 27/10/2026

Adicionada atribuição de trilha pelo gestor (`POST /api/v1/paths/[id]/assign`) com múltiplas matrículas e prazo; o aluno agora possui `/aluno/trilhas`, com estado vazio, descrição, status e prazo. Foi criado `tests/e2e/paths.spec.ts`; homologação autenticada continua pendente.

CI remoto do head documental `3eb1d0f4aa30852c794130001c531f66eaabbf4f`: web run `40475613669` e SQL/pgTAP run `40475613670`, ambos `success`.

## T17 — banco de questões e publicação — 27/10/2026

O editor de avaliações passou a aceitar múltiplas questões, opções com alternativa correta selecionável, nota mínima, tempo limite e tentativas máximas. A tela de gestão agora oferece publicação explícita de rascunhos. Criado `tests/e2e/assessment-authoring.spec.ts`; homologação autenticada permanece pendente.

CI remoto do head documental `027822949a56e0605f24bb1935cb2fd2d60e8ed2`: web run `40476060359` e SQL/pgTAP run `40476060282`, ambos `success`.

## T18 — tentativas, relógio e correção atômica — 27/10/2026

As RPCs server-side existentes mantêm o relógio fora do cliente, serializam a criação de tentativas por assessment, validam questão/opção no mesmo assessment e retornam o mesmo resultado em finalizações repetidas. A sala agora finaliza automaticamente quando o relógio chega a zero, bloqueia duplicidade de finalização e restaura a alternativa anterior quando o autosave falha. Adicionado `tests/e2e/exam.spec.ts` condicionado a conta/attempt de homologação e cobertura de `saveAnswer` em `tests/integration/attempts.test.ts`.

Verificação local: `npm run typecheck` PASS; `npm test -- --run tests/integration/attempts.test.ts` **3/3 PASS**; `npm run test:e2e -- tests/e2e/exam.spec.ts` **1 skipped** sem credenciais de tentativa autenticada. A jornada concorrente de duas abas e expiração real continuam pendentes para marcar T18 DONE.

## T19 — sala de avaliação retomável — 27/10/2026

`ExamRoom` passou a usar a entrega server-side para retomar respostas, reverter seleção quando o autosave falha, impedir dupla finalização e solicitar a finalização no servidor ao zerar o relógio. O teste `tests/e2e/exam.spec.ts` cobre relógio e botão de finalização quando executado com attempt autenticada; execução local ficou **1 skipped** sem credenciais de homologação. Perda de rede, expiração real e duas abas ainda exigem homologação autenticada.

## T20 — turmas, professores e encontros — 27/10/2026

O serviço de turmas mantém abertura e atribuição de instrutor tenant-scoped; a validação de encontros rejeita janela inválida, título vazio e fuso ausente. O agendamento já está exposto em `/api/v1/meetings` e a tela de gestão permite criar turma e encontro; criado `tests/e2e/classes.spec.ts` para homologação autenticada. Verificação local: typecheck, lint e `tests/integration/classes.test.ts` **3/3 PASS**. A jornada híbrida real com professor e turma ainda está pendente.

## T21 — chamada e QR com prazo — 27/10/2026

Adicionada a RPC `correct_attendance` e a rota `POST /api/v1/attendance/correct`, restringidas a gestor ou instrutor atribuído, com validação de tenant/turma/matrícula e evento `attendance.correct` em auditoria. O QR e a confirmação continuam com expiração de cinco minutos e idempotência. Criado `tests/e2e/attendance.spec.ts`; homologação com token real ainda pendente. A migration `20261027070000_attendance_correction.sql` foi aplicada no Supabase `zykfvzvydvifuzepujvv`; consulta remota confirmou execução para `authenticated`.

## T22 — conclusão e certificação únicas — 27/10/2026

Consulta remota confirmou que `evaluate_completion` exige matrícula e vínculo ativos, ignora nota quando não há prova publicada, não exige presença em EAD sem encontros e aplica presença por minutos programados com bloqueio de encontros futuros; em cursos híbridos, a turma da matrícula restringe os encontros. `complete_enrollment` mantém emissão idempotente por `unique(enrollment_id)` e atualiza a matrícula somente após avaliação elegível. Testes locais de serviço: **2/2 PASS**; cenários autenticados com limiares e emissão real continuam pendentes.

## T23 — PDF e validação pública — 27/10/2026

O PDF usa snapshot imutável do certificado, sem dados pessoais desnecessários, e a rota privada agora impede cache compartilhado. A página pública exibe somente titular, curso, instituição, status e código; foi criado `tests/e2e/certificate.spec.ts` para PDF/validação com fixture autenticada. Typecheck, lint e `tests/integration/certificate-verification.test.ts` **2/2 PASS**; renderização visual A4 e certificado revogado ainda exigem homologação.

## Correção de convite — 27/10/2026

Logs do Supabase mostraram links de convite com `redirect_to=http://localhost:3000`, causando botão sem destino útil. A rota agora ignora origem local configurada em produção e usa o host HTTPS da requisição; cobertura de convite: **6/6 PASS**. A publicação produtiva permanece dependente da autorização de deploy do projeto Vercel.

## T12 — catálogo central e ofertas — 27/10/2026

O GET de ofertas foi centralizado em `listCatalog`, com organização e estado de publicação aplicados no serviço antes da consulta. O isolamento final continua delegado ao RLS já aplicado no Supabase; integração de catálogo ficou **2/2 PASS**, typecheck e lint PASS. Jornada autenticada de curso central concedido para uma organização e curso próprio permanece pendente.

## T13 — matrícula, prazo e capacidade — 27/10/2026

O fluxo mantém a transação `enroll_member`, unicidade por oferta/aluno, limite de capacidade, rejeição de oferta retirada e snapshots de regra; a API agora responde conflito para oferta indisponível, futura, expirada ou cheia. Typecheck e lint PASS; integrações de matrícula/catalogo **4/4 PASS**; E2E criado e **1 skipped** sem conta não produtiva.

## T24 — satisfação após conclusão — 27/10/2026

O formulário de avaliação foi integrado à área de certificados válidos; a RPC já exige matrícula concluída, tenant correto e unicidade por matrícula. `tests/integration/feedback.test.ts`: **2/2 PASS**; E2E condicionado criado, pendente de conta não produtiva.

## T26 — relatórios e exportação — 27/10/2026

O relatório institucional passou a retornar totais e breakdowns por status/curso, com filtro temporal e tenant-scoped; CSV continua neutralizando fórmulas de planilha. Migration `reports_breakdown` aplicada no Supabase `zykfvzvydvifuzepujvv`; privilégio de execução autenticada confirmado. Typecheck, lint e testes locais de serviço/exportação **3/3 PASS**; dataset autenticado de dois tenants ainda necessário.

## T27 — outbox e recuperação de notificações — 27/10/2026

Aplicada a migration `notifications_recovery` no Supabase: `processing_at` permite recuperar jobs abandonados após 15 minutos; enqueue exige usuário autenticado e gerente do mesmo tenant para destinatários de terceiros; claim permanece exclusivo de `service_role`. Verificação remota confirmou `enqueue_notification` para authenticated e `claim_pending_notifications` somente para service role. Envio real pelo Resend ainda pendente.

## T28 — homologação SQL e jornadas completas — 27/10/2026

O conjunto E2E público/auth foi executado: **4 passaram, 5 omitidos** por ausência de Supabase público e conta não produtiva; o teste de Storage agora omite corretamente sem ambiente Supabase. O teste SQL `isolation.test.sql` continua preparado para pgTAP em banco temporário/CI; jornadas autenticadas sem professor e híbrida ainda pendentes.

## T29 — ambiente remoto e preview Vercel — 27/10/2026

O projeto `capacita-o-x5hg` foi confirmado com root Next em `apps/web`; a tentativa de deployment do `main` foi rejeitada pela Vercel com `402 api-deployments-free-per-day` (retry informado: 24h). A spec de preview agora omite corretamente sem variáveis públicas Supabase; preview do SHA atual permanece pendente.

Rechecagem posterior: o alias de produção continua no deployment READY `dpl_AFpdc7tcRRiqv99Hk4Cd7Q7EMyRH`, commit `92caa2f6698d3a612a7bbd8dfdc00552c5e47573`; ele não contém o HEAD documental atual nem as atualizações T30. Não foi feita nova tentativa enquanto a cota diária permanece bloqueada.

O deployment de produção foi criado em `2026-10-27T09:21:01Z`; a próxima tentativa segura da cota diária fica após aproximadamente `2026-10-28T09:21:01Z`, salvo mudança do limite da conta.

Consulta somente leitura no Supabase autorizado (27/10/2026) retornou `auth.users=1`, `organizations=0` e `active_memberships=0`. Portanto, não há atualmente dataset institucional ou duas contas não produtivas para executar as jornadas autenticadas sem inventar evidência; o acesso de navegador também não pôde ser capturado nesta sessão.

## Correção do botão de convite — 27/10/2026

`buildInvitationRedirect` agora aponta diretamente para `/ativar-conta?token=...`. Isso evita perder o `#access_token` devolvido pelo Supabase em uma rota exclusivamente server-side; a página cliente de ativação consome a sessão no navegador. Teste direcionado, typecheck e lint passaram; deployment público ainda pendente.

## Hardening T04/MFA — 27/10/2026

Rotas `/o/[orgId]/gestao/*` agora consultam o nível de garantia Supabase no servidor e redirecionam gestores sem `aal2` para `/mfa`, mantendo apenas destinos internos. `tests/integration/auth.test.ts`: **3/3 PASS**; typecheck, lint e build PASS. A task continua RUNNING até haver jornada autenticada com fator real.

A tela `/mfa` agora inicia cadastro TOTP quando não há fator, exibe QR/segredo e valida o primeiro código antes de retornar à rota interna. Typecheck, lint e build PASS; execução real depende de conta de homologação.

Suíte web completa após o onboarding MFA: **27 arquivos/64 testes PASS**.

T05 recebeu reenvio operacional: `GET /api/v1/invitations` lista apenas convites do tenant do gestor; `POST /api/v1/invitations/resend` aplica janela de 15 minutos, gira o token, usa origem canônica e envia via Resend. A tela de gestão agora lista convites recentes e oferece Reenviar. Typecheck, lint e build PASS; envio real continua pendente.

T06 hardening: atualização de organização agora valida `kind` contra o contrato do domínio e rejeita slug inseguro antes da escrita; a rota usa o mesmo normalizador do serviço. Teste de organizações **3/3 PASS**; suíte web **27 arquivos/65 testes PASS**, typecheck, lint e build PASS.

Auditoria de dependências local: `npm audit --audit-level=high --json` retornou **0 vulnerabilidades** (27 dependências de produção, 426 de desenvolvimento, 493 totais).

Regressão E2E de convite criada em `apps/web/tests/e2e/invitation.spec.ts`, cobrindo tela de ativação e callback com destino externo; execução local: **2 skipped** por ausência de variáveis públicas Supabase. Nova tentativa de preview Vercel para `c2c69da` retornou novamente `402 api-deployments-free-per-day` (retry 24h); não há deployment novo.

## T30 — liberação e operação — 27/10/2026

Runbooks de release, conteúdo e recuperação estão revisados e mantêm rollback, outbox, certificados, auditoria, backup e critérios de aprovação. T30 permanece RUNNING: faltam backup/restauração ensaiados, SMTP/worker real, conta E2E, preview do SHA atual e auditoria independente final.

## Correção adicional de recuperação — 27/10/2026

O fluxo `/recuperar-senha` agora resolve a origem canônica com fallback para o host HTTPS do navegador quando `NEXT_PUBLIC_APP_URL` estiver ausente ou apontar para localhost em produção; também remove barra final antes de montar o callback. Testes de origem/callback e convite: **7/7 PASS**, typecheck e lint PASS. O commit `13d6e79` foi sincronizado no `main`; depende de novo deployment para validação pública.

Após a correção, a suíte web completa foi executada novamente: **27 arquivos/63 testes PASS**, com typecheck e lint PASS; nenhum arquivo gerado permaneceu modificado.

Build de produção pós-correção: `npm run build` PASS, com 30 rotas geradas e nenhum arquivo gerado pendente.

CI remoto do commit `5b30b9d06bb9cefbf5b6123b086e225bbeb54e00` passou após corrigir o contexto JWT do pgTAP de notificações: web run `40481748235` e SQL/pgTAP run `40481748186`, ambos `success`.

Hardening adicional: a migration incremental `20261027082000_reclaim_legacy_notifications.sql` foi aplicada no Supabase `zykfvzvydvifuzepujvv`; a verificação remota confirmou `service_role=true`, `authenticated=false` e reclaim via `coalesce(processing_at, created_at)`.

Rechecagem operacional somente leitura: `notification_outbox` está sem registros e a listagem recente do Resend não apresenta mensagem de convite CapacitaGov enviada pelo worker. O envio real continua sem evidência, sem gerar dados sintéticos no banco de produção.

Resend rechecado: o domínio remetente `gestio.dev.br` está `verified` e com `Sending: enabled`; a pendência é exercitar o worker/aplicação com uma caixa de homologação, não DNS do provedor.

Correção do botão de convite — 27/10/2026: a tela `/ativar-conta` agora aguarda e confirma a sessão entregue pelo link do Supabase antes de habilitar o formulário, escuta a chegada assíncrona da sessão no fragmento da URL e exibe orientação quando o convite expirou. Typecheck, lint e suíte web **27 arquivos/66 testes PASS**. Commit local `1a12c21`; sincronizado no `main` como `aeb2d82`. A validação pública depende de novo deployment Vercel.

## Rechecagem de produção — 27/10/2026 07:23

O deploy automático do GitHub concluiu `READY` no projeto `capacita-o-x5hg`, deployment `dpl_5SpMeb6u658UAADLp1ZmByTDFEkL`, associado ao commit `5fdd925fc3242fa9ed85c9da2dbaf74a37a85a0a`. O alias `capacita-o-x5hg.vercel.app` passou a apontar para esse deployment Next atualizado. Verificação pública: `/ativar-conta` respondeu **200**; `GET /api/v1/invitations` respondeu **401** (rota presente, sessão obrigatória); `GET /auth/signout` respondeu **405** (rota presente, método POST obrigatório). O envio real autenticado por Resend e as jornadas E2E com organizações continuam pendentes.

## T27 — idempotência no provedor — 27/10/2026 07:26

O worker interno agora envia o `idempotency-key` do registro de outbox ao Resend (com fallback ao ID da notificação), evitando duplicidade quando uma entrega é confirmada pelo provedor e a resposta se perde antes da atualização do banco. A cobertura foi ampliada para **28 arquivos/68 testes PASS**, typecheck e lint PASS. O commit `c421d1d` foi sincronizado no `main`; a entrega real autenticada ainda requer caixa de homologação.

Verificação de build — 27/10/2026 07:27: `npm run build` concluiu com sucesso e enumerou as rotas dinâmicas `/api/internal/notifications`, `/api/v1/invitations`, `/api/v1/invitations/resend` e `/auth/signout`. O status do commit remoto do worker registrou falha exclusiva do Vercel por `Deployment rate limited — retry in 24 hours`; não há falha de compilação ou teste local.

## T07/T27 — auditoria PostgreSQL temporária — 27/10/2026 07:35

No PostgreSQL 18.6 temporário e isolado, a cadeia completa de **29 migrations** e **29 arquivos/224 asserções pgTAP** foi executada com resultado **PASS**. A auditoria encontrou e corrigiu a portabilidade da importação idempotente: `extensions.digest` não era resolvido em um cluster local/CI sem schema `extensions`, e `ON CONFLICT (organization_id, idempotency_key)` não inferia o índice parcial. Foi criada a migration incremental `20261027110000_fix_import_idempotency_portability.sql`, aplicada no Supabase `zykfvzvydvifuzepujvv`, e a função remota foi verificada com `ON CONFLICT DO NOTHING` e wrapper com `search_path public, extensions`. O banco temporário foi removido após o teste.

Verificação remota adicional: `extensions.digest(text,text)` existe no projeto autorizado, `public.digest` não é exigido e a operação SHA-256 retornou chave hexadecimal válida de 64 caracteres.

Homologação remota transacional da importação: sob `authenticated` com gestor temporário, duas chamadas idênticas retornaram o mesmo lote; o resultado foi `people_count=1` e `batch_count=1`. A transação terminou com `ROLLBACK`, sem dados persistentes.

Auditoria Storage remota: o bucket `course-assets` está `public=false`; as únicas políticas observadas são `course_assets_insert_manager` (INSERT condicionado a gestor da organização) e `course_assets_select_member` (SELECT condicionado a vínculo ativo). Não existe política pública de leitura irrestrita; o teste HTTP anônimo anterior retornou 400 para objeto inexistente.

Nota de segurança: `anon`/`authenticated` mantêm grants de tabela necessários ao mecanismo Storage, mas esses grants não bypassam RLS; a autorização efetiva continua nas duas políticas tenant-scoped acima. A auditoria não trata `has_table_privilege=true` como evidência de leitura pública.

## Correção do botão de convite — 27/10/2026 07:38

Corrigida a tela `/ativar-conta` para preservar o fragmento `#access_token` ao limpar o parâmetro interno do convite. Antes, `history.replaceState` removia também o hash antes de o cliente Supabase consumir a sessão; isso fazia o botão do e-mail parecer sem destino ou abrir uma ativação sem sessão. Typecheck, lint, suíte web (**29 arquivos/70 testes**) e build Next passaram. A publicação do commit continua aguardando o limite diário do Vercel.

## Backup e restauração local — 27/10/2026 07:45

Em PostgreSQL 18.6 temporário e isolado, a cadeia completa de migrations foi aplicada no banco de origem, exportada com `pg_dump --format=custom`, restaurada com `pg_restore --exit-on-error` em banco descartável e validada com cinco tabelas críticas (`organizations`, `courses`, `invitations`, `certificates`, `audit_events`). Os dois bancos e o arquivo temporário foram removidos após a validação (`cleanup=ok`). Esta evidência cobre o ensaio local; backup remoto/PITR e RTO/RPO aprovados continuam pendentes.

## Idempotência do envio de convites — 27/10/2026 07:41

As rotas de criação e reenvio de convite passaram a enviar `idempotency-key` determinística ao Resend (`invitation:<id>` e `invitation:<id>:<timestamp>`), alinhando o fluxo direto ao worker de notificações. Suíte web **29 arquivos/70 testes PASS**, typecheck, lint e build PASS. A entrega real em caixa autorizada e a publicação Vercel permanecem pendentes.

Rechecagem do repositório remoto — 27/10/2026 07:43: `main` está no commit `1f1f36c0f3685b04ab9ef6d06fc3fef176f3d20a`, contendo a correção de idempotência dos endpoints. O status Vercel continua `Deployment rate limited — retry in 24 hours`; o alias público permanece no deployment anterior `dpl_5SpMeb6u658UAADLp1ZmByTDFEkL`.

## T07 — escopo de metadados do catálogo central — 27/10/2026 07:52

Auditoria remota confirmou que `courses_select_scoped` expunha metadados de cursos centrais publicados sem concessão. A migration incremental `20261027120000_harden_course_metadata_scope.sql` criou `can_access_course_metadata` (`security definer`, `row_security=off`) e restringiu a política a versões publicadas com concessão ativa, preservando cursos próprios tenant-scoped. A primeira regressão local revelou recursão RLS; a implementação foi ajustada e a suíte final passou **29 arquivos/225 asserções**. Migration aplicada e política remota verificada no Supabase autorizado.

Prova comportamental remota transacional: com usuário autenticado e organização temporários, a consulta ao curso central retornou `before_grant=0`; após concessão ativa retornou `after_grant=1`. A transação terminou com `ROLLBACK`, sem dados persistentes.

## Produção atualizada — 27/10/2026 12:02

Após a liberação da cota, o Vercel publicou o `main` atualizado no deployment `dpl_CyaBdVz13vJ2Wp7kovUndqrEX9Dt`, commit `f99a35a0335a2a96f118a3d5cb51d391ddecbf77`, estado `READY`, com alias `capacita-o-x5hg.vercel.app`. Verificação pública: `/ativar-conta?token=test-token` respondeu 200 e `/api/v1/invitations?organizationId=test` respondeu 401 `UNAUTHENTICATED`, confirmando rota e proteção. Ainda faltam clique real de convite, jornadas autenticadas de duas organizações e auditoria final.

## Reforço da ativação de convite — 27/10/2026 12:50

A tela `/ativar-conta` passou a consumir explicitamente os formatos de sessão Supabase por fragmento (`access_token`/`refresh_token`), `code` e `token_hash`, além de preservar o token institucional. Isso elimina a condição de corrida em que o cliente não consumia o hash a tempo e o botão do e-mail parecia não fazer nada. `npm test` (**29 arquivos/70 testes**), typecheck, lint, build e E2E público de autenticação (**2 passados; 2 skips condicionados a credenciais**) passaram. A correção foi publicada no Vercel em `dpl_3Uhb8bLT8etyW7s4Fy1TBGHZWbqr`, commit `2783be1b`, alias `capacita-o-x5hg.vercel.app`; o clique real em caixa autorizada continua pendente.

## Hardening do outbox e helper de catálogo — 27/10/2026 12:55

O advisor remoto identificou `notification_outbox` sem RLS explícito, apesar de não haver grants para `anon`/`authenticated`. A migration `20261027130000_enable_notification_outbox_rls.sql` habilitou RLS e revogou privilégios diretos; a verificação confirmou `relrowsecurity=true`, `anon_select=false`, `auth_select=false` e `service_role_select=true`. O helper interno `can_access_course_metadata` deixou de ser executável por `anon` via `20261027131000_scope_course_metadata_helper.sql`; `authenticated` mantém somente o execute necessário às policies. A suíte web permaneceu **29 arquivos/70 testes PASS**; pgTAP/CI remoto da nova cadeia ainda precisa concluir.

T27 cobertura de rota — 27/10/2026 07:34: criado `tests/integration/notification-worker.test.ts`, verificando rejeição sem segredo e envio do `idempotency-key` do outbox ao provedor. Teste focado **2/2 PASS**; suíte web completa **29 arquivos/70 testes PASS**, typecheck e lint PASS. Commit `25a927c` sincronizado no `main`.

Rechecagem Vercel — 27/10/2026 07:34: o alias permanece em `dpl_5SpMeb6u658UAADLp1ZmByTDFEkL`; o commit do novo teste recebeu status `Deployment rate limited — retry in 24 hours`. Nenhum deploy adicional foi tentado.

## T04 — MFA autenticado — 27/10/2026

Homologação Playwright contra `https://capacita-o-x5hg.vercel.app` concluiu login real do gestor, seleção da organização, enrollment TOTP, desafio com código RFC 6238 e acesso à gestão: **1/1 PASS**. T04 foi promovida a DONE no plano.

## T05 — segunda condição de corrida no convite — 27/10/2026

O e-mail real entregue pelo Resend continha link de produção com `token`, `email` e `otp`, mas o clique em produção ainda exibiu convite expirado. A causa reproduzida é a concorrência entre o listener automático do Supabase e `verifyOtp` explícito: uma sessão válida era encontrada junto com erro de segunda verificação e o formulário era desabilitado. A tela foi corrigida localmente para considerar a sessão válida como autoridade e manter a validação do token institucional no endpoint de aceitação. `npm test` **29 arquivos/71 testes PASS**, typecheck e lint PASS. O commit remoto `faff903` aguarda publicação; o Vercel informou limite de mais de 100 deployments gratuitos por dia, com retry em 24h. T05 permanece RUNNING até repetir o clique após o deployment.

## T28 — rechecagem E2E e limpeza de homologação — 27/10/2026

Com contas temporárias autorizadas, a suíte pública de catálogo, navegação, preview e organização executou **3 PASS / 3 SKIP** (os skips exigem fixtures adicionais). O teste de catálogo foi estabilizado aguardando a navegação pós-login antes da rota profunda. Depois da evidência, as duas organizações sintéticas, convites e seis usuários temporários foram removidos; verificações remotas confirmaram `temp_orgs=0` e `temp_invites=0`.

O patch da condição de corrida do convite permanece aguardando a cota de deployments Vercel.

Build local pós-patch: `npm run build` PASS, 32 páginas/rotas geradas; typecheck embutido concluído sem erros. O commit `faff903` tem checks Vercel `failure` exclusivamente por `build-rate-limit`, não por falha de compilação.

## Auditoria independente local — 27/10/2026

`npm audit --prefix apps/web --audit-level=high` retornou **0 vulnerabilidades**; a busca de segredos versionados encontrou apenas referências esperadas a variáveis server-only e migrations. Parecer: **BLOCKED para liberação integral**, pois o patch final do convite não está publicado (cota Vercel) e a base autorizada não possui organização persistente para a jornada real; backup remoto/PITR e E2E final de dois tenants também continuam sem evidência.

## T06 — bootstrap seguro da primeira organização — 27/10/2026

Foi criado o endpoint protegido `POST /api/v1/organizations` para `platform_admins`, com slug derivado de forma segura e RPC transacional `create_platform_organization`. A função remota foi aplicada no Supabase e verificada: `service_role_execute=true`, `authenticated_execute=false`, `anon_execute=false`; chamada válida em transação descartável criou organização e vínculo manager sem persistir dados. A suíte web passou **29 arquivos/72 testes**, typecheck, lint e build. A criação de uma organização real permanece deliberadamente aguardando o nome/tipo fornecidos pelo usuário.
### Correção de recuperação de senha — 27/10/2026

As capturas confirmaram que o Supabase Auth ainda gerava links nativos com `localhost`. Foi implementado `/api/v1/auth/recover`: gera OTP pelo Admin API e envia link público para `/redefinir-senha` pelo Resend, com resposta genérica e idempotência por OTP. A tela de recuperação passou a usar a rota própria. Suíte: **29 arquivos/73 testes PASS**, typecheck, lint e build PASS. Código sincronizado no GitHub; aguarda deployment Vercel READY para validação real do e-mail.
### Advisor Supabase — 27/10/2026

Rechecagem remota do projeto `zykfvzvydvifuzepujvv`: RLS da `notification_outbox` sem policy é esperado para tabela exclusiva do worker `service_role`; `verify_certificate(text)` permanece executável por `anon` por ser a verificação pública exigida. Os RPCs `SECURITY DEFINER` autenticados foram revisados como superfície prevista e dependem de suas validações internas. O advisor também reporta proteção contra senhas vazadas desativada; habilitação requer configuração do Supabase Auth no painel/management API e permanece gate operacional, sem alteração destrutiva automática.
### Verificação pública do patch de recuperação — 27/10/2026 13:24 BRT

`GET https://capacita-o-x5hg.vercel.app/api/v1/auth/recover` retornou **404** no deployment atualmente publicado, confirmando que o endpoint novo ainda não chegou à produção. O código local/GitHub está validado; não enviar novo deployment até a janela de retry da Vercel.
### Rechecagem de RLS — 27/10/2026 13:25 BRT

Consulta remota ao PostgreSQL confirmou **35/35 tabelas públicas com RLS habilitado**, **0 tabelas sem RLS** e **71 policies**. A verificação complementa os testes transacionais anteriores; não houve mutação de dados.
### Paridade de migrations — 27/10/2026 13:26 BRT

O Supabase remoto lista **56 migrations** e o checkout local contém as mesmas **56 versões/nomeações** (incluindo `platform_organization_bootstrap`); não há migration local ausente no remoto após normalização dos timestamps.
### Sincronização GitHub do endpoint de recuperação — 27/10/2026 13:28 BRT

Leitura autoritativa do `main` confirmou `apps/web/src/app/api/v1/auth/recover/route.ts` no GitHub (blob `7d81f848289ab36af56f946ee71145cb589e2e58`), incluindo idempotência por OTP. A divergência atual é exclusivamente entre GitHub e o deployment público antigo.
### Rechecagem de ofertas e matrículas — 27/10/2026 13:26 BRT

As policies remotas efetivas exigem vínculo ativo para leitura; matrículas exigem gestor da mesma organização na criação e limitam leitura ao próprio vínculo ou gestor; ofertas exigem gestor da organização e, para cursos centrais, concessão ativa correspondente. Não foram detectadas condições de autorização cross-tenant nessa inspeção; a homologação autenticada de duas organizações continua necessária para fechar T12/T13/T28.
### Configuração Auth pendente — 27/10/2026 13:29 BRT

A documentação oficial confirma que a proteção contra senhas vazadas é uma opção do **Auth settings** e está disponível no plano Pro ou superior. O conector não fornece mutação dessa configuração; permanece ação operacional no painel Supabase antes da liberação integral: [Password security](https://supabase.com/docs/guides/auth/password-security).
### Variáveis Vercel — 27/10/2026 13:30 BRT

Leitura sem descriptografia confirmou `NEXT_PUBLIC_APP_URL` correto em produção/preview/desenvolvimento, `NEXT_PUBLIC_SUPABASE_URL`, `EMAIL_PROVIDER_URL`, `EMAIL_FROM` e as chaves server-only (`SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_PROVIDER_KEY`, `NOTIFICATION_JOB_SECRET`) presentes como variáveis sensíveis. Nenhum valor secreto foi lido ou registrado.
### Sincronização documental remota — 27/10/2026 13:28 BRT

O Git CLI local não possui credencial autorizada para push (`403`); a integração GitHub sincronizou os documentos de estado, testes, auditoria, operações e plano diretamente no `main`. Nenhum segredo foi incluído.
### Cobertura do endpoint de recuperação — 27/10/2026 13:28 BRT

Foi adicionada cobertura de rota para o incidente de links localhost: **3/3 testes** verificam origem canônica, OTP/idempotência, validação e não enumeração. Suíte web: **30 arquivos/76 testes PASS**; typecheck e lint PASS. Teste sincronizado no GitHub (`1717abb`).

