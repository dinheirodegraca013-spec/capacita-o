# CapacitaGov — plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para implementar task por task no agente principal. Subagentes não são padrão neste projeto. Passos usam checkboxes para evidência de execução.

**Goal:** reconstruir a plataforma institucional com catálogo central e cursos próprios, aprendizagem sem professor ou acompanhada, persistência e isolamento comprovados.

**Architecture:** monólito modular novo em `capacita-o/apps/web`, dentro de checkout independente do repositório existente. Next.js/TypeScript e Supabase; servidor valida sessão/contexto e banco impõe RLS. Legado preservado para consulta.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind, Supabase Auth/Postgres/Storage, npm, Vitest, Playwright, SQL tests e Vercel. Versões serão verificadas e fixadas em T01.

**Spec:** [desenho](../specs/2026-10-26-capacitagov-design.md).

Estado: plano proposto, não executado. Catálogo central + cursos próprios confirmado pelo usuário. Arquivos abaixo são destinos planejados; ainda não existem. Caminhos técnicos são relativos a `capacita-o/apps/web/`, exceto os prefixados explicitamente por `README.md`, `.github/` e `docs/rebuild/`, relativos ao checkout.

## Global Constraints

- Repositório exclusivo `dinheirodegraca013-spec/capacita-o`; Supabase remoto exclusivo `zykfvzvydvifuzepujvv`.
- Não sobrescrever alterações nos checkouts antigos; nunca resetar banco remoto para testar.
- Catálogo central + cursos próprios; professor opcional para autoinstrucional; papéis pertencem ao vínculo institucional.
- Sem service role no navegador, sem mockDb em fluxo definitivo, sem autorização por user_metadata ou tenant informado pelo cliente.
- Todas as tabelas expostas e objetos Storage com controle de acesso real; provas/certificados/capacidade com transações.
- Conteúdo e regras publicados são versionados; matrícula fixa versão e critérios.
- Oferta altera apenas prazo, obrigatoriedade, capacidade, inscrição, professores e branding; critérios pedagógicos mudam somente em nova versão.
- Matrícula única por pessoa/oferta; turma da mesma oferta obrigatória quando houver encontros; recursar exige nova oferta. Presença por minutos programados, chamada integral, justificado não dá crédito, cancelados excluídos.
- Padrões propostos: nota 70%, presença 75%, QR 5 min, reenvio de convite 15 min, CSV 500 linhas/2 MiB, arquivo 100 MiB.
- Dados sintéticos apenas em teste/demonstração; catálogo real precisa de conteúdo próprio/licenciado.
- Produção e recursos pagos exigem a autorização aplicável ao resultado concreto.

## Review Focus

1. Mesma pessoa com dois vínculos e cache SSR: contexto e conteúdo não podem atravessar instituições (T02/T03/T28).
2. Remoção de concessão e publicação de nova versão: preservar matrícula/histórico conforme regra explícita (T09/T12/T13).
3. Requisições concorrentes/repetidas: vaga, tentativa, presença e certificado não duplicam (T13/T18/T21/T22).
4. Organização sem professor e sem curso: não exigir instrutor fictício nem inventar catálogo (T09/T11/T14/T28).
5. Falha de e-mail/rede/tempo e material inacessível: recuperação sem liberar acesso indevido ou perder dados confirmados (T05/T10/T15/T19/T27).

## Metas e ordem

| Meta | Entrega | Tasks | Aceite da meta |
| --- | --- | --- | --- |
| M0 | Checkout e base nova | T01 | Aplicação e CI reproduzíveis |
| M1 | Identidade e acesso | T02–T05 | Sessões, MFA e convites em dois tenants |
| M2 | Instituição e pessoas | T06–T08 | Gestão isolada, importação atômica, navegação acessível |
| M3 | Cursos e catálogos | T09–T12 | Curso central concedido e curso próprio publicados |
| M4 | Aprendizagem | T13–T16 | Matrícula, continuidade e trilhas persistentes |
| M5 | Avaliações | T17–T19 | Tentativas retomáveis, expiração/correção no servidor |
| M6 | Presencial/híbrido | T20–T21 | Turmas e presença autorizadas |
| M7 | Conclusão | T22–T24 | Certificados únicos e validação mínima |
| M8 | Governança | T25–T27 | Auditoria, indicadores e notificações recuperáveis |
| M9 | Homologação e publicação | T28–T30 | Jornadas reais, preview e liberação verificados |

T25 deve ser executada logo após T03, antes de mutações administrativas. Ordem preferida: T01,T02,T03,T25,T04,T05,T06,T07,T08,T09,T10,T11,T12,T13,T14,T15,T16,T17,T18,T19,T20,T21,T22,T23,T24,T26,T27,T28,T29,T30. Todas começam PENDING; dependências expressam pré-requisitos técnicos, não aprovação externa automática.

## Contratos e arquivos compartilhados

- `src/modules/shared/result.ts`: `Result<T> = {ok:true,data:T}|{ok:false,error:{code:ErrorCode,message:string,requestId:string}}`; códigos `UNAUTHENTICATED|FORBIDDEN|NOT_FOUND|VALIDATION|CONFLICT|RATE_LIMITED|UNAVAILABLE` correspondem a 401/403/404/422/409/429/503. T01 cria contrato e adaptador HTTP.
- T02 define `Actor` e roles `manager|instructor|student`; privilégio global separado `PlatformActor`, validado no servidor por `platform_admins`.
- `src/modules/*/model.ts`: definir os DTOs nomeados nas respectivas tasks antes dos consumidores. IDs UUID; datas ISO-8601 UTC na persistência, fuso institucional na interface; paginação `{items,total,page,pageSize}`, default 20 e máximo 100.
- `supabase/migrations/`: criar nomes com `supabase migration new <nome>`, sem inventar timestamp. `supabase/tests/`: SQL/pgTAP contra Supabase local. Testar grants e RLS como anon/authenticated, nunca somente service role.
- `tests/fixtures/`: organizações A/B, gestor/aluno/professor, pessoa com múltiplos vínculos e curso central/próprio; nenhum seed automático no remoto.
- `src/modules/audit/service.ts`: T25 fornece o contrato usado por todas as mutações. Dependência implícita de tasks de mutação em T25 além das listadas.
- Uma operação de domínio descrita como `Promise<Entity>` retorna entidade tipada e falhas de domínio mapeadas pelo adaptador para Result; não confiar no cliente para construir Actor.

## Ciclo obrigatório por task

- [ ] Ler Rxx do desenho e contratos das dependências; conferir status e diffs do checkout.
- [ ] Escrever primeiro os cenários de falha listados no aceite quando envolver regra de negócio/segurança; rodar teste focado e observar falha real. Configuração/markup simples usa verificação direta proporcional.
- [ ] Implementar somente a entrega descrita; migrations locais revisadas, sem executar operações remotas nesta etapa.
- [ ] Rodar teste indicado, `npm run typecheck` e `npm run lint`; executar `npm run build` ao mudar integração de build/servidor ou fechar meta. SQL: `supabase test db`; E2E: `npx playwright test <arquivo>`. T01 configura scripts e descobre CLI via --help.
- [ ] Revisar diff, registrar comando/resultado/risco no estado, marcar REVIEW e depois DONE somente com evidência; criar commit pequeno dos arquivos da task. Não fazer push/merge/deploy como efeito automático de concluir task.

Status único: PENDING → RUNNING → REVIEW → DONE; BLOCKED somente para dependência real externa ou decisão indispensável. Um teste mockado de SQL nunca aprova RLS. Falha após duas tentativas sem progresso exige reavaliar hipótese antes de editar novamente.

## Tasks

### T01 — Preparar checkout e aplicação isolada

**Meta/prioridade:** M0/P0. **Status:** DONE. **Depende:** —. **Requisitos:** R09,R10.

**Criar/alterar:** `README.md`, `apps/web/package.json`, `apps/web/package-lock.json`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `.github/workflows/web.yml`.

**Teste/evidência:** `apps/web/tests/smoke.test.ts`.

**Interface e entrega:** Página inicial e pipeline de typecheck/lint/test/build. Clonar o repo na subpasta capacita-o; criar branch feat/capacitagov-rebuild a partir da main atual. Não mover nem sobrescrever os checkouts antigos. Transportar estes documentos para docs/rebuild do checkout preservando origem e links.

**Aceite verificável:** Instalação limpa e build executáveis; CI aponta apps/web; falha de configuração mostra estado explícito e nunca login demo.

- [x] T01 concluída: `npm ci --legacy-peer-deps`, `npm test` (1/1), `npm run typecheck`, `npm run lint` (0 erros) e `npm run build` (rotas `/` e `/_not-found`).

### T02 — Identidade, vínculos e papéis

**Meta/prioridade:** M1/P0. **Status:** DONE. **Depende:** T01. **Requisitos:** R01,R09.

**Criar/alterar:** `src/modules/identity/model.ts`, `src/modules/identity/repository.ts`, `supabase/migrations/<gerado>_identity.sql`.

**Teste/evidência:** `supabase/tests/identity.test.sql`.

**Interface e entrega:** Actor={userId,organizationId,membershipId,roles}; getActor(organizationId): Promise<Actor>. Roles de plataforma não vêm do formulário ou user_metadata. IdentityRepository consulta profiles, organizations, org_units, memberships, membership_roles e platform_admins.

**Aceite verificável:** Dois tenants e uma pessoa com dois vínculos; SELECT/INSERT/UPDATE/DELETE cruzados negados, vínculo inativo negado, bootstrap sem endpoint público; mudanças de organization_id rejeitadas.

- [x] T02 concluída: migration aplicada em PostgreSQL 18 local no WSL com pgTAP; 14/14 checks verdes, incluindo isolamento entre tenants, vínculo inativo oculto, mutações negadas e organização imutável. `npm test`, typecheck e lint verdes. `supabase test db` continua indisponível por exigir Docker, mas a suíte pgTAP foi executada diretamente no PostgreSQL real.

### T03 — Clientes SSR e sessão validada

**Meta/prioridade:** M1/P0. **Status:** DONE. **Depende:** T02. **Requisitos:** R01,R09.

**Criar/alterar:** `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/admin.ts`, `src/modules/identity/session.ts`, `src/app/api/v1/context/route.ts`.

**Teste/evidência:** `tests/integration/session.test.ts`.

**Interface e entrega:** requireActor(organizationId): Promise<Actor>; GET /api/v1/context lista somente vínculos próprios. Cliente administrativo server-only; consultas comuns pelo usuário e RLS.

**Aceite verificável:** Sem sessão/inválida/expirada retorna 401; tenant sem vínculo retorna 403; usuário A nunca recebe resposta cacheada de B; bundle sem chave de serviço.

- [x] Executar ciclo da task e anexar evidência; revisão concluída em 27/10: `tests/integration/session.test.ts` 3/3, endpoint `/api/v1/context` anônimo em produção 401 com `Cache-Control: private, no-store`, e busca de código confirmou que a chave de serviço só é importada pelo cliente administrativo server-only.

### T04 — Login, recuperação, contexto e MFA

**Meta/prioridade:** M1/P0. **Status:** RUNNING. **Depende:** T03. **Requisitos:** R01,R04.

**Criar/alterar:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/recuperar-senha/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/(auth)/mfa/page.tsx`, `src/app/(portal)/selecionar-organizacao/page.tsx`.

**Teste/evidência:** `tests/e2e/auth.spec.ts`.

**Interface e entrega:** signIn(email,password), signOut(), seleção de vínculo e desafio MFA para administração; retorno de callback apenas para caminhos internos permitidos.

**Aceite verificável:** E-mail/senha válidos entram; senha errada não enumera conta; callback externo bloqueado; logout bloqueia próxima leitura; gestor sem MFA não entra em administração de produção.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T05 — Convites institucionais recuperáveis

**Meta/prioridade:** M1/P0. **Status:** RUNNING. **Depende:** T04. **Requisitos:** R01,R08.

**Criar/alterar:** `src/modules/invitations/service.ts`, `src/app/api/v1/invitations/route.ts`, `src/app/(auth)/ativar-conta/page.tsx`, `supabase/migrations/<gerado>_invitations.sql`.

**Teste/evidência:** `tests/integration/invitations.test.ts`, `tests/e2e/invitation.spec.ts`.

**Interface e entrega:** inviteMember(actor,{email,roles}): Promise<Invitation>; registro pending/sent/accepted/failed, chave idempotente e reenvio mínimo 15 min. E-mail já existente em outro tenant adiciona vínculo mediante aceitação, sem duplicar identidade nem revelar outra instituição.

**Aceite verificável:** Convite duplicado/expirado/consumido, concorrência de reenvio, falha SMTP e retomada testados; vínculo não é ativo antes da aceitação; gestor não promove administrador global.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T06 — Gestão de organização e unidades

**Meta/prioridade:** M2/P0. **Status:** RUNNING. **Depende:** T03. **Requisitos:** R01,R08.

**Criar/alterar:** `src/modules/organizations/service.ts`, `src/app/(portal)/o/[orgId]/gestao/organizacao/page.tsx`, `src/app/api/v1/organizations/[orgId]/route.ts`.

**Teste/evidência:** `tests/integration/organizations.test.ts`.

**Interface e entrega:** updateOrganization(actor,input) e saveOrgUnit(actor,input); nome/tipo/cores/logo com validação, secretaria/departamento são rótulos configuráveis.

**Aceite verificável:** Empresa sem secretaria e prefeitura com unidades funcionam; gestor não modifica outra instituição; upload de logo usa tipo/tamanho permitidos e autorização.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T07 — Pessoas e importação transacional

**Meta/prioridade:** M2/P0. **Status:** RUNNING. **Depende:** T05,T06. **Requisitos:** R08,R09.

**Criar/alterar:** `src/modules/people/service.ts`, `src/modules/imports/service.ts`, `src/app/(portal)/o/[orgId]/gestao/pessoas/page.tsx`, `src/app/api/v1/imports/route.ts`, `supabase/migrations/<gerado>_imports.sql`.

**Teste/evidência:** `tests/integration/imports.test.ts`.

**Interface e entrega:** previewImport(actor,file): Promise<ImportPreview>; commitImport(actor,batchId): Promise<ImportResult>. Lote máximo 500 linhas/2 MiB; revalidar o lote guardado no servidor; convites via T05 após commit.

**Aceite verificável:** CPF opcional; email normalizado e duplicidade no tenant tratados; lote alterado pelo cliente não é aceito; erro de linha não produz gravação parcial; repetir lote não duplica pessoas/convites.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T08 — Estrutura visual e navegação institucional

**Meta/prioridade:** M2/P1. **Status:** RUNNING. **Depende:** T04,T06. **Requisitos:** R04.

**Criar/alterar:** `src/components/layout/portal-shell.tsx`, `src/components/ui/`, `src/app/(portal)/o/[orgId]/layout.tsx`, `src/app/globals.css`.

**Teste/evidência:** `tests/e2e/navigation.spec.ts`.

**Interface e entrega:** PortalShell recebe contexto autorizado e capacidades; menus aluno/gestor/professor/admin, organização ativa visível e estados vazio/erro/loading.

**Aceite verificável:** Teclado, foco, contraste AA e 360px; rota direta continua autorizada no servidor; nomes longos e instituição sem logo não quebram navegação.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T09 — Conteúdo, versões e autoria

**Meta/prioridade:** M3/P0. **Status:** RUNNING. **Depende:** T02. **Requisitos:** R02,R03,R09.

**Criar/alterar:** `src/modules/courses/model.ts`, `src/modules/courses/service.ts`, `src/app/api/v1/courses/route.ts`, `supabase/migrations/<gerado>_courses.sql`.

**Teste/evidência:** `tests/integration/courses.test.ts`, `supabase/tests/courses.test.sql`.

**Interface e entrega:** createCourse(actor,input), saveDraft(actor,courseId,input), publishCourse(actor,courseId): Promise<CourseVersion>. Cursos centrais por curadoria; próprios por proprietário; versionar módulos/aulas/regras na publicação.

**Aceite verificável:** Rascunho não aparece ao aluno; versão publicada não muda; curso autoinstrucional aceita professor nulo; conteúdo institucional não cruza tenant; publicação vazia ou sem licença falha.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T10 — Arquivos privados e acesso aos materiais

**Meta/prioridade:** M3/P0. **Status:** RUNNING. **Depende:** T09. **Requisitos:** R04,R09.

**Criar/alterar:** `src/modules/assets/service.ts`, `src/app/api/v1/assets/route.ts`, `src/app/api/v1/assets/[id]/access/route.ts`, `supabase/migrations/<gerado>_assets_storage.sql`.

**Teste/evidência:** `tests/integration/assets.test.ts`, `supabase/tests/storage.test.sql`.

**Interface e entrega:** createAssetUpload(actor,input): Promise<UploadGrant>; authorizeAsset(actor,assetId): Promise<SignedAsset>. MP4/PDF/áudio, máximo inicial 100 MiB; uploads diretos privados; URLs com expiração curta.

**Aceite verificável:** Extensão/MIME/tamanho incorretos e arquivo não pronto bloqueados; download direto sem direito negado; matrícula de outra instituição não libera arquivo; nunca bucket público para aula.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T11 — Editor de cursos e publicação

**Meta/prioridade:** M3/P1. **Status:** RUNNING. **Depende:** T08,T09,T10. **Requisitos:** R03,R04.

**Criar/alterar:** `src/app/(portal)/o/[orgId]/gestao/cursos/page.tsx`, `src/app/(portal)/o/[orgId]/gestao/cursos/[courseId]/page.tsx`, `src/components/courses/course-editor.tsx`.

**Teste/evidência:** `tests/e2e/course-authoring.spec.ts`.

**Interface e entrega:** Editor consome serviços T09/T10, ordena módulos/aulas, cadastra autoria, legendas/transcrições e critérios; mostra revisão antes de publicar.

**Aceite verificável:** Gestor cria e publica curso próprio; curador publica central; modo sem professor salvo sem campo obrigatório indevido; erros de upload/publicação preservam rascunho.

- [x] Implementado editor com conteúdo de aula, módulos persistidos visíveis, validação de títulos e bloqueio de publicação sem conteúdo; `course-authoring.spec.ts` criado para homologação autenticada.
- [ ] Executar jornada autenticada e anexar evidência; revisar antes de marcar DONE.

### T12 — Concessões centrais e ofertas

**Meta/prioridade:** M3/P0. **Status:** RUNNING. **Depende:** T09,T10. **Requisitos:** R02,R09.

**Criar/alterar:** `src/modules/catalog/service.ts`, `src/app/api/v1/catalog/grants/route.ts`, `src/app/api/v1/offerings/route.ts`, `supabase/migrations/<gerado>_offerings.sql`.

**Teste/evidência:** `tests/integration/catalog.test.ts`, `supabase/tests/catalog.test.sql`.

**Interface e entrega:** grantCourse(platformActor,{organizationId,courseVersionId}), createOffering(actor,input), listCatalog(actor,filters): Promise<OfferingPage>. Direitos por concessão ou matrícula preservada; versionId fixo na oferta.

**Aceite verificável:** Central concedido a A invisível para B; gestor não cria concessão global nem muda critérios pedagógicos da versão; retirada bloqueia novas matrículas e mantém antigas conforme regra; emergência bloqueia conteúdo e audita.

- [x] Serviço `listCatalog` e GET de ofertas agora impõem organização e estado de publicação; teste de integração incluído (**2/2 PASS** em catálogo).
- [ ] Executar jornada autenticada central concedido/curso próprio e anexar evidência; revisar antes de marcar DONE.

### T13 — Matrícula, prazo e capacidade

**Meta/prioridade:** M4/P0. **Status:** RUNNING. **Depende:** T07,T12. **Requisitos:** R03,R05,R09.

**Criar/alterar:** `src/modules/enrollments/service.ts`, `src/app/api/v1/enrollments/route.ts`, `supabase/migrations/<gerado>_enrollments.sql`.

**Teste/evidência:** `tests/integration/enrollments.test.ts`.

**Interface e entrega:** enroll(actor,{offeringId,memberId}): Promise<Enrollment>; atribuição e autoinscrição autorizada, snapshot de versão/regras, unicidade por aluno/oferta e transação de capacidade.

**Aceite verificável:** Dois pedidos para última vaga não ultrapassam capacidade; reenvio não duplica; oferta suspensa/tenant divergente bloqueados; turma de outra oferta recusada; recursar em nova oferta permite nova matrícula; alteração futura de regra não muda matrícula existente.

- [x] RPC de matrícula mantém capacidade transacional, idempotência e snapshots; rota traduz ofertas indisponíveis para conflito e teste pgTAP ampliado.
- [ ] Executar jornada autenticada e anexar evidência; revisar antes de marcar DONE.

### T14 — Catálogo e biblioteca do aluno

**Meta/prioridade:** M4/P1. **Status:** RUNNING. **Depende:** T08,T12,T13. **Requisitos:** R04.

**Criar/alterar:** `src/app/(portal)/o/[orgId]/aluno/page.tsx`, `src/app/(portal)/o/[orgId]/aluno/catalogo/page.tsx`, `src/app/(portal)/o/[orgId]/aluno/cursos/page.tsx`, `src/components/courses/course-card.tsx`.

**Teste/evidência:** `tests/e2e/student-catalog.spec.ts`.

**Interface e entrega:** Listas paginadas e busca por título/categoria/modalidade; detalhes da oferta, prazos, matrícula autorizada e biblioteca própria.

**Aceite verificável:** Busca sem resultados mostra estado vazio; catálogo sem cursos não fabrica conteúdo; aluno enxerga somente suas matrículas e ofertas acessíveis; links externos não marcam conclusão interna.

- [x] Catálogo e biblioteca exibem estados vazios reais, prazos, política de matrícula e capacidade; jornada E2E criada.
- [ ] Executar jornada autenticada e anexar evidência; revisar antes de marcar DONE.

### T15 — Player e progresso persistente

**Meta/prioridade:** M4/P0. **Status:** RUNNING. **Depende:** T10,T13,T14. **Requisitos:** R04,R05.

**Criar/alterar:** `src/modules/learning/service.ts`, `src/app/(portal)/o/[orgId]/aluno/cursos/[enrollmentId]/page.tsx`, `src/app/api/v1/progress/route.ts`, `supabase/migrations/<gerado>_progress.sql`.

**Teste/evidência:** `tests/integration/progress.test.ts`, `tests/e2e/learning.spec.ts`.

**Interface e entrega:** recordProgress(actor,{enrollmentId,lessonId,positionSeconds,completed}): Promise<LessonProgress>; vídeo/áudio/PDF/texto, retomada por matrícula e atividades obrigatórias.

**Aceite verificável:** Recarregar e nova sessão retomam posição; aula alheia/posição impossível negadas; POST repetido não aumenta progresso; leitura confirma sem tempo fictício; falha de mídia é explícita.

- [x] Player exibe conteúdo textual salvo, retoma posição persistida e envia progresso idempotente; E2E de aprendizagem criado.
- [ ] Executar jornada autenticada e anexar evidência; revisar antes de marcar DONE.

### T16 — Trilhas e obrigatoriedades

**Meta/prioridade:** M4/P1. **Status:** RUNNING. **Depende:** T13,T15. **Requisitos:** R03,R04.

**Criar/alterar:** `src/modules/paths/service.ts`, `src/app/(portal)/o/[orgId]/gestao/trilhas/page.tsx`, `src/app/(portal)/o/[orgId]/aluno/trilhas/page.tsx`, `supabase/migrations/<gerado>_paths.sql`.

**Teste/evidência:** `tests/integration/paths.test.ts`.

**Interface e entrega:** assignPath(actor,{pathId,memberIds,dueAt}); learning_paths/path_items ordenam ofertas e dependências, impedindo ciclos.

**Aceite verificável:** Etapa seguinte bloqueada até requisito completo; prazo corretamente convertido para fuso exibido; trilha não concede conteúdo que tenant não possui; repetição não duplica matrícula.

- [x] Gestão cria etapas, publica e atribui trilhas com prazo; aluno possui tela de trilhas atribuídas e estado vazio.
- [ ] Executar jornada autenticada e anexar evidência; revisar antes de marcar DONE.

### T17 — Banco de questões e regras de prova

**Meta/prioridade:** M5/P0. **Status:** RUNNING. **Depende:** T09. **Requisitos:** R05.

**Criar/alterar:** `src/modules/assessments/authoring.ts`, `src/app/(portal)/o/[orgId]/gestao/avaliacoes/page.tsx`, `supabase/migrations/<gerado>_assessments.sql`.

**Teste/evidência:** `tests/integration/assessment-authoring.test.ts`.

**Interface e entrega:** saveAssessment(actor,input), publishAssessment(actor,assessmentId); questions/options privados e parâmetros congelados na versão.

**Aceite verificável:** Publicação exige questões válidas e resposta correta; professor não atribuído não edita; DTO do aluno não contém is_correct/explanation antes da correção; limites de tempo/tentativas validados.

- [x] Editor aceita múltiplas questões/opções, nota mínima, limite de tempo, tentativas e publicação explícita; E2E de autoria criado.
- [ ] Executar jornada autenticada e anexar evidência; revisar antes de marcar DONE.

### T18 — Tentativa, relógio e correção atômica

**Meta/prioridade:** M5/P0. **Status:** RUNNING. **Depende:** T13,T17. **Requisitos:** R05,R09.

**Criar/alterar:** `src/modules/assessments/attempts.ts`, `src/app/api/v1/attempts/route.ts`, `src/app/api/v1/attempts/[id]/answers/route.ts`, `src/app/api/v1/attempts/[id]/finish/route.ts`, `supabase/migrations/<gerado>_attempts.sql`.

**Teste/evidência:** `tests/integration/attempts.test.ts`.

**Interface e entrega:** startAttempt(actor,enrollmentId), saveAnswer(actor,attemptId,input), finishAttempt(actor,attemptId): Promise<AttemptResult>; transações para limites, expiração e resultado idempotente.

**Aceite verificável:** Duas abas não excedem tentativas; relógio não depende do cliente; resposta após expiração rejeitada; finish repetido retorna mesmo resultado; IDs de questão/opção alheios recusados.

- [x] Camada server-side usa RPCs transacionais para relógio, limite de tentativas, respostas e correção idempotente; sala finaliza automaticamente ao expirar e preserva respostas não salvas.
- [ ] Executar jornada autenticada em duas abas e anexar evidência; revisar antes de marcar DONE.

### T19 — Sala de avaliação retomável

**Meta/prioridade:** M5/P1. **Status:** RUNNING. **Depende:** T08,T18. **Requisitos:** R04,R05.

**Criar/alterar:** `src/app/(portal)/o/[orgId]/aluno/avaliacoes/[attemptId]/page.tsx`, `src/components/assessments/exam-room.tsx`.

**Teste/evidência:** `tests/e2e/exam.spec.ts`.

**Interface e entrega:** Tela consome remainingSeconds do servidor, autosave confirmado, retoma respostas, exibe resultado permitido; incidentes de foco informativos.

**Aceite verificável:** F5 não reinicia tempo; perda de rede indica não salvo e permite retomar; expiração finaliza pelo servidor; teclado utilizável; troca de aba não reprova automaticamente.

- [x] Sala consome a entrega server-side, retoma respostas, confirma autosave, exibe relógio e solicita finalização automática quando expira; teste E2E condicionado a attempt autenticada criado.
- [ ] Executar jornada autenticada com perda de rede/expiração e anexar evidência; revisar antes de marcar DONE.

### T20 — Turmas, professores e encontros

**Meta/prioridade:** M6/P1. **Status:** RUNNING. **Depende:** T06,T09,T13. **Requisitos:** R03,R06.

**Criar/alterar:** `src/modules/classes/service.ts`, `src/app/(portal)/o/[orgId]/gestao/turmas/page.tsx`, `src/app/(portal)/o/[orgId]/professor/page.tsx`, `supabase/migrations/<gerado>_classes.sql`.

**Teste/evidência:** `tests/integration/classes.test.ts`.

**Interface e entrega:** openClass(actor,input), assignInstructor(actor,input), scheduleMeeting(actor,input); class_groups, instructor_assignments e meetings.

**Aceite verificável:** Curso acompanhado exige atribuição ativa; autoinstrucional não exige professor; híbrido/presencial exige encontros e responsável pela chamada; aluno/professor alheio não vê dados; fim anterior ao início recusado.

- [x] Turmas, atribuição de instrutor e agendamento de encontros já usam serviços/API tenant-scoped; validação exige janela e fuso explícitos; criado E2E condicionado a gestor.
- [ ] Executar jornada autenticada de curso híbrido e anexar evidência; revisar antes de marcar DONE.

### T21 — Chamada e QR com prazo

**Meta/prioridade:** M6/P0. **Status:** RUNNING. **Depende:** T20. **Requisitos:** R06,R09.

**Criar/alterar:** `src/modules/attendance/service.ts`, `src/app/api/v1/meetings/[id]/qr/route.ts`, `src/app/api/v1/attendance/route.ts`, `src/components/attendance/roll-call.tsx`, `supabase/migrations/<gerado>_attendance.sql`.

**Teste/evidência:** `tests/integration/attendance.test.ts`, `tests/e2e/attendance.spec.ts`.

**Interface e entrega:** issueAttendanceToken(actor,meetingId), confirmAttendance(actor,{meetingId,token}), correctAttendance(actor,input); expiração 5 min e janela do encontro.

**Aceite verificável:** Token vazio/aleatório/expirado e de outro encontro negados; matrícula ausente negada; repetição não duplica; gestor/professor atribuído pode corrigir com auditoria; instituição B nunca aceita token de A.

- [x] QR de 5 minutos, confirmação idempotente e correção de presença por gestor/instrutor foram expostos por RPC/API; correções geram evento de auditoria; E2E condicionado criado.
- [ ] Executar jornada autenticada com token válido, inválido e expirado; revisar antes de marcar DONE.

### T22 — Conclusão e certificação únicas

**Meta/prioridade:** M7/P0. **Status:** RUNNING. **Depende:** T15,T18,T21. **Requisitos:** R05,R07.

**Criar/alterar:** `src/modules/completion/service.ts`, `src/modules/certificates/service.ts`, `src/app/api/v1/enrollments/[id]/complete/route.ts`, `supabase/migrations/<gerado>_completion.sql`.

**Teste/evidência:** `tests/integration/completion.test.ts`.

**Interface e entrega:** evaluateCompletion(actor,enrollmentId): Promise<CompletionDecision>; completeEnrollment(actor,enrollmentId): Promise<Certificate>. CompletionDecision={eligible,missingRequirements}; transação e unique(enrollment_id).

**Aceite verificável:** Sem prova ignora nota; EAD sem encontros ignora presença; híbrido exige ambos; 69%/74% falham e limites 70%/75% passam se demais critérios cumpridos; presença ponderada por minutos programados, justificado zero, cancelados excluídos e encontro futuro bloqueia; duas finalizações emitem um certificado.

- [x] RPCs tenant-scoped avaliam aulas, provas publicadas e presença ponderada por minutos; EAD sem encontros não exige presença, híbrido exige; certificado tem unique por matrícula e finalização idempotente.
- [ ] Executar cenários autenticados EAD/híbrido com limiares e anexar evidência; revisar antes de marcar DONE.

### T23 — PDF e verificação pública mínima

**Meta/prioridade:** M7/P0. **Status:** RUNNING. **Depende:** T22. **Requisitos:** R07,R04.

**Criar/alterar:** `src/app/(portal)/o/[orgId]/aluno/certificados/page.tsx`, `src/app/validar-certificado/[code]/page.tsx`, `src/app/api/v1/certificates/[id]/pdf/route.ts`, `src/modules/certificates/document.tsx`.

**Teste/evidência:** `tests/e2e/certificate.spec.ts`, `tests/integration/certificate-verification.test.ts`.

**Interface e entrega:** renderCertificate(certificateSnapshot): PDF; verifyCertificate(code): PublicCertificate com campos previstos no desenho; revogação por serviço autorizado e motivo.

**Aceite verificável:** A4 sem corte com nomes longos; QR aponta domínio configurado; público não recebe CPF/email/matrícula/nota; código inválido/revogado claro; certificado antigo mantém versão e emissor originais.

- [x] PDF A4 e validação pública usam snapshot do certificado sem CPF/e-mail/nota; download privado agora envia `cache-control: private, no-store`; E2E condicionado criado.
- [ ] Executar renderização visual e validação autenticada/revogada; revisar antes de marcar DONE.

### T24 — Satisfação após conclusão

**Meta/prioridade:** M7/P1. **Status:** RUNNING. **Depende:** T22. **Requisitos:** R08.

**Criar/alterar:** `src/modules/feedback/service.ts`, `src/components/feedback/course-feedback.tsx`, `supabase/migrations/<gerado>_feedback.sql`.

**Teste/evidência:** `tests/integration/feedback.test.ts`.

**Interface e entrega:** submitFeedback(actor,{enrollmentId,rating,comment}): Promise<CourseEvaluation>; rating inteiro 1–5, uma por matrícula concluída.

**Aceite verificável:** Não concluinte e tenant alheio bloqueados; repetição não soma avaliação; comentário tratado como texto; média e contagem são reais e tenant-scoped.

- [x] Feedback validado por RPC com rating 1–5, uma avaliação por matrícula concluída; formulário integrado à área de certificados e E2E condicionado criado.
- [ ] Executar jornada autenticada e anexar evidência; revisar antes de marcar DONE.

### T25 — Auditoria consistente das mutações

**Meta/prioridade:** M8/P0. **Status:** DONE. **Depende:** T03. **Requisitos:** R08,R09.

**Criar/alterar:** `src/modules/audit/service.ts`, `src/app/(portal)/o/[orgId]/gestao/auditoria/page.tsx`, `supabase/migrations/<gerado>_audit.sql`.

**Teste/evidência:** `tests/integration/audit.test.ts`, `supabase/tests/audit.test.sql`.

**Interface e entrega:** appendAudit(actor,event) como fronteira interna; integração obrigatória nas mutações desde sua criação. Aluno/gestor não escrevem ou apagam eventos diretamente.

**Aceite verificável:** INSERT/UPDATE/DELETE diretos de usuário negados; gestor lê somente seu tenant; convite/presença/concessão/certificado/mudança de papel deixam evento com resultado, sem segredo/CPF.

- [x] T25 concluída: audit_events com RLS somente leitura por tenant, gravação interna, bloqueio de INSERT/UPDATE/DELETE direto e redaction de dados sensíveis; pgTAP 9/9 e testes de serviço 2/2 verdes.

### T26 — Relatórios e exportação

**Meta/prioridade:** M8/P1. **Status:** RUNNING. **Depende:** T07,T13,T15,T22,T25. **Requisitos:** R08.

**Criar/alterar:** `src/modules/reporting/service.ts`, `src/app/(portal)/o/[orgId]/gestao/relatorios/page.tsx`, `src/app/api/v1/reports/route.ts`.

**Teste/evidência:** `tests/integration/reports.test.ts`, `tests/e2e/reports.spec.ts`.

**Interface e entrega:** getTrainingReport(actor,filters): TrainingReport; exportReport(actor,filters): CSV; contagem por status, unidade, curso e período com denominadores definidos.

**Aceite verificável:** Dataset conhecido de dois tenants produz totais exatos; cancelado não infla conclusão; dados vazios mostram zero; filtro não altera tenant; células iniciadas com fórmula são neutralizadas.

- [x] Relatório agora retorna totais, breakdown por status/curso e CSV com neutralização de fórmulas; migration aplicada e privilégio autenticado verificado.
- [ ] Executar dataset autenticado de dois tenants e anexar evidência; revisar antes de marcar DONE.

### T27 — Notificações com outbox e recuperação

**Meta/prioridade:** M8/P1. **Status:** PENDING. **Depende:** T05,T13,T25. **Requisitos:** R01,R08,R09.

**Criar/alterar:** `src/modules/notifications/service.ts`, `src/app/api/internal/notifications/route.ts`, `supabase/migrations/<gerado>_notifications.sql`, `docs/rebuild/operations/email.md`.

**Teste/evidência:** `tests/integration/notifications.test.ts`.

**Interface e entrega:** enqueueNotification(actor,input), deliverPendingNotifications(): DeliverySummary. Chave única por evento/destinatário; job autenticado, até 5 tentativas e backoff; SMTP Auth conforme contrato atual do Supabase.

**Aceite verificável:** Falha não desfaz matrícula válida; retry não cria outro vínculo; job público negado; mensagem sem PII desnecessária; entrega real testada só em caixa e remetente autorizados.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T28 — Homologação SQL e duas jornadas completas

**Meta/prioridade:** M9/P0. **Status:** PENDING. **Depende:** T01–T27. **Requisitos:** R01–R10.

**Criar/alterar:** `tests/e2e/institution-self-paced.spec.ts`, `tests/e2e/institution-hybrid.spec.ts`, `supabase/tests/isolation.test.sql`, `docs/rebuild/TESTES.md`, `docs/rebuild/AUDITORIA.md`.

**Teste/evidência:** `Conjunto de testes listado nesta task`.

**Interface e entrega:** Cenário A: convite→catálogo central→matrícula→aulas→prova→certificado sem professor. B: curso próprio→professor→turma híbrida→presença→prova→certificado→relatório. Ataques de acesso cruzado por API, SQL e Storage.

**Aceite verificável:** Banco real local, sem mock de RLS; nenhuma jornada usa mockDb; duas sessões simultâneas isoladas; todas as regressões P0 passadas; evidências de navegador e resultados registrados.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T29 — Ambiente remoto e preview Vercel

**Meta/prioridade:** M9/P0. **Status:** PENDING. **Depende:** T28. **Requisitos:** R10.

**Criar/alterar:** `docs/rebuild/operations/deploy.md`, `apps/web/.env.example`, `apps/web/next.config.ts`, `.github/workflows/web.yml`.

**Teste/evidência:** `tests/e2e/preview.spec.ts`.

**Interface e entrega:** Criar/vincular Vercel no escopo do proprietário com root apps/web; definir uso do Supabase informado; revisar migration e grants antes de aplicar; cadastrar callbacks exatos e secrets por ambiente.

**Aceite verificável:** Preview protegido abre todas as rotas profundas; auth callback, RLS e arquivos funcionam; nenhum dado/segredo de outro projeto; build e E2E do SHA implantado registrados. Não criar serviço pago sem autorização.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

### T30 — Liberação e operação verificadas

**Meta/prioridade:** M9/P0. **Status:** PENDING. **Depende:** T29. **Requisitos:** R08,R10.

**Criar/alterar:** `docs/rebuild/operations/recovery.md`, `docs/rebuild/operations/content.md`, `docs/rebuild/ESTADO.md`, `docs/rebuild/AUDITORIA.md`.

**Teste/evidência:** `Checklist de liberação com links às evidências T28/T29`.

**Interface e entrega:** Confirmar conteúdo real/licenças, retenção institucional, MFA, SMTP, limites e backups; ensaiar restauração em ambiente descartável; registrar deploy anterior e rollback; aprovação final do ambiente de publicação.

**Aceite verificável:** Nenhuma pendência P0; responsáveis e suporte definidos; recuperação comprovada; publicar somente após revisão final concreta e autorização aplicável; status não muda para DONE com testes pendentes.

- [ ] Executar ciclo da task e anexar evidência; revisar antes de marcar DONE.

## Transferência e limites

O executor Luna deve receber este plano e o desenho. Usar o agente principal, carregar apenas a seção atual e dependências, consultar skills do módulo quando necessário e evitar repetir o benchmark. Os nomes de arquivo são contratos propostos: mudança justificada deve atualizar produtor, consumidor e tarefa antes de avançar.

Homologação M9 exige evidência nova do produto reconstruído. CI antigo ou painel com porcentagens não contam. Se o ambiente local não suportar PostgreSQL/Supabase, continuar UI/domínio independente, marcar integração como pendente e resolver ambiente de teste antes de autorizar schema remoto. Não substituir testes RLS por inspeção de strings SQL.

P2 do desenho é backlog posterior e não faz parte da liberação inicial. Não criar automaticamente 30 chats nem executar em paralelo o mesmo checkout. A troca de modelo é feita pelo usuário; este plano não alterou o modelo da conversa.

## Autorrevisão

R01→T02–T07; R02→T09/T12/T13; R03→T09/T11/T13/T16/T20; R04→T04/T08/T10/T14/T15/T19/T23; R05→T15/T17–T19/T22; R06→T20/T21; R07→T22/T23; R08→T07/T24–T27/T30; R09→T02/T03/T09/T10/T12/T13/T18/T21/T22/T25/T28; R10→T01/T28–T30. Cada risco do Review Focus aponta para teste específico. Conteúdo real, remetente e política institucional de retenção são dependências operacionais explícitas, não entregas fictícias.


