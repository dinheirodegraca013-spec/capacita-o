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

Rechecagem de publicação: o domínio de produção está em `dpl_AFpdc7tcRRiqv99Hk4Cd7Q7EMyRH` (commit `92caa2f`), enquanto o checkout e os registros avançaram além desse SHA. A liberação integral segue não aprovada até existir preview/deployment do HEAD e homologação autenticada.

O limite diário não deve ser reavaliado por novas tentativas antes de `2026-10-28T09:21:01Z`; até lá a divergência entre produção e HEAD é um bloqueio externo conhecido.

O banco autorizado não possui organizações nem memberships ativos (`auth.users=1`, `organizations=0`, `active_memberships=0`), logo não há evidência possível de isolamento/jornadas autenticadas de dois tenants neste ciclo.

**Parecer: BLOCKED para liberação integral; implementação continua em andamento.**

Evidências novas: callback de convite com `code`/`token_hash`, navegação responsiva em 360px, ofertas para todas as versões publicadas, typecheck/testes/build locais e CI remoto web + pgTAP verdes. O branch `feat/capacitagov-rebuild` permanece limpo e o PR continua draft.

Pendências que impedem PASS: E2E autenticado de duas organizações com contas de homologação explícitas; teste operacional de convite/SMTP e worker; backup, restauração e rollback ensaiados; preview Vercel do HEAD atual. A criação do preview foi tentada com o repositório correto e está bloqueada pela cota `api-deployments-free-per-day` (HTTP 402). Produção não foi alterada nesta auditoria.

### Correção do envio do convite — 27/10/2026

Diagnóstico: novos convites usavam `inviteUserByEmail`, deixando a entrega dependente do SMTP nativo do Supabase; o Resend era acionado apenas quando o usuário já existia. Correção: gerar o link no Supabase e enviar sempre pelo Resend server-only, com fallback para `magiclink` em contas existentes e marcação `failed` em erro de geração/entrega. Verificações locais passaram; o teste de caixa de entrada e a validação em produção continuam pendentes por falta de conta de homologação e novo deployment.

### T11 — editor de cursos — 27/10/2026

Implementação parcial verificada: conteúdo persistido é carregado no editor, novas aulas aceitam texto, a API valida títulos e a publicação fica bloqueada no cliente quando não há conteúdo. Typecheck, Vitest e build passaram; o E2E autenticado foi criado, mas ficou skipped sem credenciais de homologação. T11 permanece RUNNING e não pode ser considerada concluída.

CI remoto confirmou web e SQL/pgTAP verdes no head `dbce0b205a2c3fd218985b7afb99802563e0fbdd` (runs `40474451225` e `40474451137`). Isso não substitui a homologação autenticada.

### T14 — catálogo e biblioteca — 27/10/2026

Implementação parcial verificada: o cartão de oferta exibe janela/capacidade e falha de matrícula com alerta; o E2E de catálogo/biblioteca foi criado. Sem conta não produtiva, a jornada autenticada ainda não pode ser considerada evidência de aceite.

CI remoto confirmou web e SQL/pgTAP verdes no head documental `c4b7bfdfd2c3aa4eebc82d3c6b3880915e2610d9` (runs `40474826961` e `40474826848`).

### T15 — player e progresso — 27/10/2026

Implementação parcial verificada: conteúdo da aula e posição persistida estão disponíveis no player, com RPC idempotente já coberto por pgTAP. O E2E autenticado foi criado, mas ainda não há matrícula de homologação para executá-lo; T15 permanece RUNNING.

CI remoto confirmou web e SQL/pgTAP verdes no head documental `83ae989c390ff7568b3507a6ca041850ab68dc27` (runs `40475154744` e `40475154694`).

### T16 — trilhas — 27/10/2026

Implementação parcial: atribuição com prazo e tela do aluno foram adicionadas, mantendo RLS e a prevenção SQL de ciclos. O E2E autenticado ainda não pode ser executado sem conta de homologação; T16 permanece RUNNING.

CI remoto confirmou web e SQL/pgTAP verdes no head documental `3eb1d0f4aa30852c794130001c531f66eaabbf4f` (runs `40475613669` e `40475613670`).

### T17 — avaliações — 27/10/2026

Implementação parcial verificada: autoria de múltiplas questões e publicação de rascunho foram adicionadas sobre RPCs transacionais existentes. O E2E autenticado ainda depende de conta não produtiva; T17 permanece RUNNING.

CI remoto confirmou web e SQL/pgTAP verdes no head documental `027822949a56e0605f24bb1935cb2fd2d60e8ed2` (runs `40476060359` e `40476060282`).

### T12 — catálogo — 27/10/2026

O serviço passou a impor `organizationId` e estado de publicação no caminho de leitura. O RLS remoto continua sendo a barreira de isolamento; falta somente comprovar a jornada autenticada de concessão central, curso próprio e tenant vizinho.

### T13 — matrícula — 27/10/2026

O servidor mantém a matrícula em RPC com lock, unicidade e snapshots; a interface de erro não trata oferta retirada como sucesso. A prova restante é executar duas contas reais contra uma última vaga e confirmar tenant divergente no Supabase/CI.

### T24 — feedback — 27/10/2026

A avaliação está vinculada à matrícula concluída e protegida por unicidade/RPC; a tela só a expõe junto a certificados válidos. Falta comprovar a média agregada e a tentativa cross-tenant em execução autenticada.

### T26 — relatórios — 27/10/2026

O relatório mantém autorização por gestor e organização, e a exportação neutraliza valores iniciados por `=`, `+`, `-` ou `@`. A migration de breakdown foi aplicada e a prova restante é um dataset controlado com dois tenants, incluindo matrícula cancelada.

### T27 — notificações — 27/10/2026

O job não é público: claim exige `service_role`, o enqueue rejeita payload com PII sensível e itens em processamento podem ser recuperados após timeout. Falta apenas comprovação de entrega real e retry contra o Resend autorizado.

### T28 — homologação — 27/10/2026

As fronteiras públicas passaram sem sessão; não há evidência suficiente para declarar as jornadas completas porque Supabase público e credenciais de homologação não estão disponíveis neste ambiente. O status permanece RUNNING.

### T29 — preview — 27/10/2026

O escopo do projeto Vercel e o root `apps/web` estão documentados, mas o deployment atual não foi atualizado: a API retornou cota diária esgotada. Não marcar preview como verificado.

### Achado P1 — botão de convite — 27/10/2026

O convite redirecionava para callback server-side, incompatível com o fragmento de sessão (`#access_token`) que o Supabase pode devolver após `generateLink`; o usuário via um botão sem destino útil. Corrigido para `/ativar-conta` client-side, com token interno preservado. Evidência local: teste direcionado 4/4, typecheck/lint PASS. Risco remanescente: confirmar no próximo deployment e entrega Resend real.

Achado T04: a página MFA existia, mas a proteção de gestão não exigia AAL2 no servidor. Corrigido no layout institucional com `getAuthenticatorAssuranceLevel()` e retorno interno; evidência 3/3 testes, typecheck/lint/build PASS. E2E de gestor com fator real permanece pendente.

Complemento: `/mfa` deixou de ser uma tela sem saída; quando necessário, cria fator TOTP, mostra QR/segredo e verifica o primeiro código. A exigência AAL2 permanece no servidor. Homologação real ainda pendente.

Regressão local completa: Vitest **27/27 arquivos, 64/64 testes PASS**; isso não substitui o E2E autenticado.

T05 hardening: reenvio agora exige gestor no tenant, filtra o convite por organização, impõe rate limit de 15 minutos e faz rotação do token antes do envio. A UI não expõe convites de outro tenant. Falta provar concorrência/entrega com Supabase/Auth/Resend reais.

T06 hardening: a API não aceita mais `kind` fora do enum institucional nem slug fora do padrão do banco; a validação é compartilhada com o serviço. Evidência: 3/3 testes de organização e 65/65 testes web, além de typecheck/lint/build. Homologação multi-tenant permanece pendente.

Auditoria de dependências: `npm audit --audit-level=high` sem vulnerabilidades high/critical; não há correção de pacote pendente neste ciclo.

Foi criada regressão Playwright de convite (`invitation.spec.ts`) para ativação e bloqueio de destino externo; os dois casos foram omitidos localmente por falta de ambiente público Supabase, portanto a evidência permanece insuficiente até executar com conta/ambiente de homologação.

### T30 — liberação — 27/10/2026

Correção auditável: recuperação não monta mais callback com localhost configurado em produção; o host HTTPS do navegador é usado como fallback e destinos externos continuam rejeitados. A eficácia em produção aguarda novo deployment e e-mail real.

Regressão pós-correção: suíte Vitest completa **27/27 arquivos, 63/63 testes**, além de typecheck e lint, sem alterações geradas pendentes.

Build Next de produção também passou e enumerou 30 rotas; isso não substitui o deployment público do HEAD.

A falha anterior do SQL/pgTAP foi reproduzida no run `40481533748`: `enqueue_notification` rejeitava o teste por ausência de `auth.uid()`. O teste foi corrigido com claim JWT autenticada; o run `40481748186` passou integralmente, sem relaxar a proteção da função.

Como a migration original já estava aplicada, o reclaim foi entregue por migration incremental `20261027082000` e verificado diretamente no banco autorizado; não foi feita alteração retroativa dependente de reexecução.

O gate de entrega permanece aberto: o outbox está vazio e a conta Resend não mostra convite CapacitaGov recente do worker. Isso é ausência de evidência operacional, não aprovação implícita.

### Atualização da ativação do convite — 27/10/2026 12:50

A causa técnica foi reforçada em `/ativar-conta`: a sessão Supabase agora é consumida explicitamente nos formatos hash OAuth, `code` e `token_hash`, sem perder o token institucional. Typecheck, lint, build, suíte web e E2E público passaram. Risco remanescente: ainda não há clique comprovado a partir de uma mensagem real entregue pelo Resend em caixa de homologação autorizada.

O advisor Supabase também reportou `notification_outbox` sem RLS. Embora os grants diretos já estivessem revogados, isso era uma defesa incompleta. A migration `20261027130000_enable_notification_outbox_rls.sql` corrigiu a configuração e foi verificada remotamente; `can_access_course_metadata` também foi removido da superfície `anon`. O alerta crítico foi eliminado; permanecem avisos esperados de funções `SECURITY DEFINER` autenticadas e da proteção de senhas comprometidas, que exigem decisão/configuração operacional separada.

O domínio de envio foi confirmado como verificado e habilitado; o risco remanescente é a integração end-to-end do worker com uma caixa autorizada.

Os critérios de liberação estão documentados, mas não há evidência suficiente para aprovação final. Pendências P0 operacionais permanecem abertas; não declarar produção pronta.

### Estado autoritativo mais recente — 27/10/2026 07:19

- O alias de produção aponta para `dpl_3ck2DvwQZQ8uoKNisi3CymyZco2S`, commit `db81004f3392d85524f066a5a1701854787bcbc9`; o HEAD do checkout ainda não está público.
- O Vercel confirma `SUPABASE_SERVICE_ROLE_KEY` sensível e variáveis Resend configuradas; valores secretos não foram lidos.
- RLS remoto: 34/35 tabelas públicas habilitadas, `notification_outbox` service-only sem grants públicos, `course-assets` privado. Testes transacionais cross-tenant de leitura e escrita passaram com rollback.
- Playwright público mais recente: 5 passed/22 skipped; os skips exigem contas e fixtures autenticadas. O bloqueio de liberação permanece deployment atualizado, E2E autenticado de dois tenants, worker/SMTP operacional, backup/restauração e auditoria independente.

### Correção de estado — 27/10/2026 07:35

O bloco histórico acima foi superseded por rechecagem posterior: o alias público passou a apontar para `dpl_5SpMeb6u658UAADLp1ZmByTDFEkL`, deployment Next READY. As rotas públicas `/ativar-conta`, `/api/v1/invitations` e `/auth/signout` responderam, respectivamente, 200, 401 e 405 nos métodos sem sessão. O HEAD posterior inclui hardening de idempotência do worker e da importação; a Vercel voltou a rejeitar novos commits por `Deployment rate limited — retry in 24 hours`. A liberação integral continua não aprovada por ausência de E2E autenticado de dois tenants, entrega Resend em caixa autorizada, backup/restauração e auditoria final independente.

### Regressão corrigida — botão do convite — 27/10/2026 07:38

Causa raiz identificada na ativação: a limpeza da URL removia o fragmento de sessão retornado pelo Supabase junto com o parâmetro do convite. A correção mantém o hash durante a inicialização do cliente Supabase. Verificações locais passaram; ainda falta validar um clique real em e-mail entregue por Resend.

Backup/restauração local ensaiados em PostgreSQL temporário com dump customizado e restauração sem erro; os artefatos foram removidos ao final. O gate operacional ainda exige backup remoto/PITR, RTO/RPO e rollback de deployment, além das jornadas E2E autenticadas e auditoria independente final.

As rotas de convite agora usam chaves idempotentes no Resend tanto na criação quanto no reenvio, reduzindo duplicidade em retries. A mudança foi compilada e testada localmente; ainda sem confirmação de entrega real.

Achado importante corrigido: metadados de cursos centrais publicados não são mais visíveis sem concessão ativa. A correção passou a usar helper `security definer` isolado para evitar recursão entre policies de `courses` e `course_versions`; pgTAP local e policy remota foram verificados.

O comportamento foi validado remotamente em transação descartável (`before_grant=0`, `after_grant=1`, `ROLLBACK`), sem introduzir dados de homologação na produção.

O alias de produção agora aponta para o deployment `dpl_CyaBdVz13vJ2Wp7kovUndqrEX9Dt` (commit `f99a35a`), após a cota Vercel ser liberada. As rotas públicas críticas responderam conforme esperado; a liberação integral continua condicionada a E2E autenticado, entrega real Resend e revisão final independente.
### Parecer independente — 27/10/2026

Resultado: **BLOCKED para liberação integral**. A revisão local confirmou `npm audit` sem vulnerabilidades high/critical, build/typecheck/lint/testes verdes e ausência de segredos versionados. Não aprovo produção porque o patch final de convite ainda não foi publicado por limite de deployments Vercel e não há organização de homologação persistente para completar a jornada autenticada de convite; permanecem também os gates de backup remoto/PITR e auditoria E2E completa.

### Reauditoria de links de autenticação — 27/10/2026

Achado P0 reproduzido nas capturas: links nativos de recuperação apontavam para `localhost`. A correção customiza a recuperação via Resend e OTP Supabase, sem registrar segredo no cliente ou revelar existência de conta. Verificações locais verdes (**73 testes**, typecheck, lint e build). Não aprovar como corrigido em produção até o deployment do patch e um clique real em e-mail entregue.
### Advisor Supabase — 27/10/2026

Os avisos remotos foram triados: `notification_outbox` service-only e `verify_certificate` público são comportamentos intencionais documentados; a proteção contra senhas vazadas está desativada e deve ser habilitada no Auth antes da liberação integral. O alerta não é mascarado como correção de código.

