# CapacitaGov — Auth and Tenant Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a primeira fatia verificável de backend seguro: sessão individual Supabase, perfil institucional ativo, isolamento por organização e listagem de cursos da organização, sem expor nenhuma API demonstrativa fora de localhost.

**Architecture:** Preservar o frontend React e a API Express como fachada. A execução segura ficará isolada em src/server/secure/, usando validação Supabase Auth por requisição e cliente de dados com JWT do usuário para que o PostgreSQL aplique RLS; a implementação legada ficará isolada exclusivamente em demonstração local com opt-in. Este plano cobre a base de autenticação e a primeira rota de leitura; não declara o restante do produto migrado.

**Tech Stack:** React 19, TypeScript, Express 4, Node 22+, Bun 1.4.1 (CI), Supabase Auth/PostgreSQL, @supabase/supabase-js (versão fixada e lockfile atualizado na implementação), node:test com tsx, GitHub Actions.

**Spec:** docs/superpowers/specs/2026-10-16-capacitagov-secure-migration-design.md

## Global Constraints

- Branch isolada já existente: fix/capacitagov-security-baseline-20261016. Não publicar em main, não fazer merge nem deploy de produção.
- Supabase DEV **exclusivo do CapacitaGov**; nunca inferir ID por projeto de outro sistema. Sem confirmação do ambiente DEV, executar apenas tarefas locais e registrar BLOCKED para integração.
- Usuários de teste e tenants A/B inteiramente sintéticos, sem CPF verdadeiro. Não importar demonstração como dado institucional.
- Legado Express em server.ts só inicia com NODE_ENV development/test e CAPACITAGOV_ALLOW_INSECURE_DEMO=true, ligado a 127.0.0.1. Este modo não pode ser habilitado por flags na web.
- Nenhum login por CPF/e-mail isolado, nenhum switch-role, nenhum uso de role/org/client claims como fonte de autorização.
- Nunca colocar service_role ou secret key em client/browser nem elevar permissões para contornar RLS.
- Toda alteração SQL é versionada usando a ferramenta oficial de migrações, testada do zero em DEV e revisada antes de aplicar a qualquer ambiente compartilhado.
- Cada tarefa segue RED -> GREEN -> regressão -> commit -> CI. Registrar de forma distinta testes executados, não executados e evidências.
- MFA para gestores/superadmin, revisão jurídica da verificação pública de certificado e autorização fina por hierarquia permanecem gates de homologação — esta fase não os declara concluídos.

## Review Focus

1. Token inexistente/inválido/expirado -> GET /api/auth/me retorna 401 e não consulta perfis de terceiros (Task 3).
2. Conta institucional inativa ou organização suspensa -> 403 mesmo com token Auth válido (Task 3).
3. Pessoa do tenant A pede curso do tenant B por ID arbitrário -> nenhum registro nem conteúdo atravessa a fronteira; RLS e API negam (Tasks 2 e 5).
4. Campo role/organization_id manipulado na requisição -> não eleva direitos nem troca tenant; ações de gerenciamento permanecem indisponíveis (Tasks 3 e 6).
5. Frontend reiniciado, token revogado e logout -> nenhuma sessão falsamente mantida e nenhuma API demonstrativa acessível em secure mode (Tasks 1 e 4).

## File map e limites desta fase

- Existing: server.ts, src/server/productionSafety.ts, src/lib/supabase.ts, src/services/api.ts, src/context/AuthContext.tsx, src/components/auth/LoginPage.tsx, src/App.tsx, package.json, bun.lock e .github/workflows/ci.yml.
- New secure backend: src/server/secure/server.ts (bootstrap), src/server/secure/app.ts (rotas mínimas), src/server/secure/auth.ts (identidade validada por requisição), src/server/secure/courses.ts (leitura por tenant), src/server/secure/types.ts (contratos internos).
- New frontend: src/lib/supabaseClient.ts (cliente publicável), src/components/secure/SecureCoursesPage.tsx (único fluxo funcional liberado nesta fase, sem dados fictícios).
- New tests: tests/secureRuntime.test.ts, tests/secureAuth.test.ts, tests/secureCourses.test.ts, tests/secureClientSession.test.ts; testes reais de RLS em tests/integration/ (executados exclusivamente no DEV).
- New SQL: arquivo criado pelo Supabase CLI em supabase/migrations/ para vínculo de identidade e políticas verificadas. O nome/timestamp vem do CLI, não deve ser inventado.
- Não reescrever server.ts monolítico nesta fase. O executor seguro é separado e qualquer API não implementada responde 404/501 sem fallback ao mockDb.

---

### Task 1: Isolar o modo seguro do backend de demonstração

**Files:**
- Create: src/server/secure/app.ts, src/server/secure/server.ts
- Modify: package.json, src/server/productionSafety.ts (somente se a validação precisar de função exportada)
- Test: tests/secureRuntime.test.ts

**Interfaces:**
- Consumes: configuração de ambiente como argumento injetável; Express existente.
- Produces: createSecureApp(deps: SecureDeps): Express, startSecureServer(env: NodeJS.ProcessEnv): Promise<void> e um script explícito start:secure. SecureDeps aceita middleware de identidade e módulo de cursos injetáveis nas próximas tarefas.

- [ ] Step 1 RED: criar testes com supertest ou requisição HTTP local em tests/secureRuntime.test.ts: secure mode rejeita qualquer rota /api/auth/switch-role com 404; /api/auth/login legado também não existe; /api/health retorna somente status; modo inseguro sem opt-in lança SECURITY_BLOCK.
- [ ] Step 2: executar bun run test; observar falha devido à ausência de createSecureApp (não por erro de sintaxe).
- [ ] Step 3 GREEN: implementar app e bootstrap separados, sem importar mockDb, com middleware de erros que não imprime dados sensíveis. Criar start:secure apontando diretamente para secure/server.ts; não contornar o gate do server.ts legado nem expor o demo em Vercel/preview.
- [ ] Step 4: executar bun run test, bun run lint e bun run build; exigir exit code 0 e ausência das rotas de demo.
- [ ] Step 5: commit com mensagem feat: isolate secure API runtime.

### Task 2: Identidade institucional vinculada ao Auth e base de RLS

**Files:**
- Create: supabase/migrations/<timestamp_do_cli>_identity_tenant_baseline.sql
- Create: tests/integration/identityRls.test.ts
- Modify: docs/SECURITY_MIGRATION_STATUS.md

**Interfaces:**
- Consumes: tabelas public.users, organizations, courses e auth.users da migração inicial.
- Produces: public.users.auth_user_id UUID UNIQUE referenciando auth.users(id), inicialmente nullable SOMENTE durante migração; nenhuma conta sem vínculo poderá acessar a nova API. Políticas SELECT de perfil próprio e cursos por tenant.

- [ ] Step 1 RED: preparar fixtures A e B em banco **DEV recém-identificado**, com dois Auth users vinculados e outro desvinculado; testar SELECT de perfis/cursos pelo JWT de A (somente A), JWT de B (somente B) e anon (nada), além de UPDATE de role/organization_id (negado).
- [ ] Step 2: executar testes de integração em DEV e registrar falhas reais causadas por políticas existentes; bloquear execução se ambiente não for comprovadamente DEV.
- [ ] Step 3 GREEN: via Supabase CLI gerar migration com nome oficial, criar FK e índice único, revisar WITH CHECK, grants e políticas SELECT mínimas. Corrigir ou substituir políticas legado que permitam UPDATE de privilégios. Revisar SECURITY DEFINER, search_path e EXECUTE; não conceder superpoderes ao browser.
- [ ] Step 4: reconstruir banco descartável DEV do zero com migrations em ordem; repetir teste de A/B, anon, role spoofing, e verificação de org suspensa (pelo backend na Task 3).
- [ ] Step 5: registrar plano de reconciliação de contas legadas sem vincular por CPF/e-mail; capturar resultado SQL e commit com mensagem security: bind authenticated identities and enforce tenant RLS.

### Task 3: Middleware de identidade por requisição e rota /auth/me

**Files:**
- Create: src/server/secure/auth.ts, src/server/secure/types.ts
- Modify: src/server/secure/app.ts
- Test: tests/secureAuth.test.ts

**Interfaces:**
- Consumes: tabela com auth_user_id da Task 2; cliente Supabase usando token de cada requisição.
- Produces: resolveActor(bearer: string | undefined, provider: AuthProvider): Promise<ActorContext>, ActorContext { actorId: string; authUserId: string; organizationId: string | null; role: UserRole; active: boolean }, requireActor: RequestHandler; GET /api/auth/me retorna { user, organization } limitado a dados aprovados.

- [ ] Step 1 RED: testes com provedor injetado cobrindo bearer ausente/malformado/expirado (401), vínculo ausente (403), conta inativa/org suspensa (403), perfil válido (200), spoof de role/org enviado por query/body (ignorado).
- [ ] Step 2: executar bun run test e observar falha do comportamento não implementado.
- [ ] Step 3 GREEN: obter Auth user validado no provedor a cada sessão, consultar perfil institucional atual por auth_user_id, negar por padrão e registrar logs sem CPF/token. Operar leitura do banco com JWT do usuário (RLS efetivo), NÃO com cliente administrativo ignorando RLS. A implementação de session_id revocation-sensitive deve ser considerada no gate de segurança.
- [ ] Step 4: bun run test, bun run lint, bun run build + integração DEV da rota; registrar resultados inclusive falhas.
- [ ] Step 5: commit feat: authenticate secure API requests.

### Task 4: Login real, restauração e logout de sessão no frontend

**Files:**
- Create: src/lib/supabaseClient.ts
- Modify: src/lib/supabase.ts, src/context/AuthContext.tsx, src/components/auth/LoginPage.tsx, src/services/api.ts, src/App.tsx, package.json, bun.lock
- Test: tests/secureClientSession.test.ts (testes de adaptador) e fluxo E2E de login em DEV

**Interfaces:**
- Consumes: supabaseClient singleton (publicável), api.getMe() da Task 3.
- Produces: login(email: string, password: string): Promise<boolean>, logout(): Promise<void>, refresh(): Promise<void>, e fetchApi que envia Authorization: Bearer usando a sessão atual apenas em modo seguro. AuthContext não expõe switchRole.

- [ ] Step 1 RED: testar login sem senha -> falha, login válido -> getMe chama sessão real, expiração/logout -> estado limpo e API sem token; restauro de sessão não confia em usuário persistido no navegador.
- [ ] Step 2: rodar teste e confirmar RED esperado.
- [ ] Step 3 GREEN: instalar @supabase/supabase-js em versão exata compatível e atualizar lockfile; obter URL e chave publicável de variáveis VITE_ (nenhum segredo); substituir formulário CPF-only por email/senha; retirar atalhos para perfis fictícios e switchRole do contrato; manter link público para certificados sem expor dados não aprovados. UI usa retorno real de /auth/me para navegar por papel; não mantém usuário em caso de falha.
- [ ] Step 4: executar testes, typecheck, build e E2E com contas sintéticas; incluir teste de sessão revogada. Qualquer requisito MFA de papéis privilegiados sem implementação mantém preview bloqueada.
- [ ] Step 5: commit feat: use verified Supabase sessions in frontend.

### Task 5: Primeira fatia vertical — listagem segura de cursos

**Files:**
- Create: src/server/secure/courses.ts, src/components/secure/SecureCoursesPage.tsx
- Modify: src/server/secure/app.ts, src/App.tsx, src/services/api.ts
- Test: tests/secureCourses.test.ts e tests/integration/courseRls.test.ts

**Interfaces:**
- Consumes: requireActor e ActorContext Task 3; tabelas courses, enrollments, users sob RLS.
- Produces: GET /api/courses (lista apenas publicada e autorizada para usuário), GET /api/courses/:id (detalhe autorizado ou 404), DTO Course sem campos de outros tenants, UI de listagem no modo seguro; demais rotas seguem indisponíveis e visivelmente indicadas como ainda não migradas.

- [ ] Step 1 RED: com cursos publicados do tenant A, publicados do B e rascunho do A, testar que aluno A obtém apenas publicados do A; GET por id de B -> 404; usuário sem sessão -> 401; manipular organizationId no query não muda escopo.
- [ ] Step 2: executar testes e documentar RED.
- [ ] Step 3 GREEN: handlers Express usando cliente com JWT e filtro explícito pelo ActorContext, com RLS como segunda barreira; excluir draft para alunos. Frontend renderiza carregando/vazio/erro sem inventar quantidades. Nenhum módulo do demo é ligado no secure mode.
- [ ] Step 4: testes unitários e integração DEV, bun run lint, bun run build e E2E de aluno A/B. Confirmar consultas A/B SQL e API de forma independente.
- [ ] Step 5: commit feat: list authorized tenant courses.

### Task 6: Endurecer permissões e falhas de configuração

**Files:**
- Modify: src/server/secure/server.ts, src/server/secure/app.ts, src/lib/supabaseClient.ts, .env.example
- Create: tests/secureConfiguration.test.ts
- Test: tests/secureRuntime.test.ts (regressão)

**Interfaces:**
- Consumes: runtime seguro das Tasks 1–5.
- Produces: validateSecureConfiguration(env: NodeJS.ProcessEnv): SecureConfig, sem defaults que apontem para ambiente de outro sistema.

- [ ] Step 1 RED: testes para SUPABASE_URL ausente, chave publicável ausente, service-role acidental em variável VITE_, backend inseguro exposto em preview, CORS inesperado e rota não implementada; devem falhar fechados sem vazamento de informação.
- [ ] Step 2: executar testes e obter RED esperado.
- [ ] Step 3 GREEN: validação explícita de variáveis e ambiente, separar variáveis client/server, cabecalhos seguros e CORS restrito quando necessário. Documentar Vercel Preview como INDISPONÍVEL até token/URL DEV testados e MFA exigida.
- [ ] Step 4: executar suite completa e build; validar manualmente saída de erro sem segredos ou CPF.
- [ ] Step 5: commit security: fail closed on secure API misconfiguration.

### Task 7: Integração CI, rastreabilidade e corte de aceitação da fase

**Files:**
- Modify: .github/workflows/ci.yml, docs/SECURITY_MIGRATION_STATUS.md
- Create: docs/superpowers/plans/2026-10-16-capacitagov-phase1-evidence.md (registro de evidências)
- Test: scripts/CI já existentes; tests/integration/*.test.ts e E2E DEV criados nas tarefas anteriores.

**Interfaces:**
- Consumes: comandos bun run test, bun run lint, bun run build, teste de integração com banco DEV dedicado e rotas seguras.
- Produces: jobs obrigatórios de testes/lint/build e gate de integração em DEV que NÃO se confunde com sucesso quando não configurado; matriz CG-AUTH-01..04 e CG-TENANT-01..03 com links a evidências.

- [ ] Step 1 RED: tornar obrigatória na verificação de release uma prova de integrações e negativos A/B; falta de credenciais DEV deve resultar em BLOCKED e jamais PASS.
- [ ] Step 2: executar checks locais no CI e um teste intencionalmente negativo de configuração; registrar códigos de saída.
- [ ] Step 3 GREEN: adicionar job isolado de integração com segredos DEV e controles de fork/PR; sem secret, status informativo BLOCKED e branch NÃO é promovida a release. Nunca publicar tokens nos logs.
- [ ] Step 4: revisar PR e diff completo com skill final-auditor; executar teste+tipos+build e integração/E2E quando DEV estiver disponível; registrar cada resultado na evidência.
- [ ] Step 5: commit ci: gate secure auth and tenant integration acceptance.

## Critérios de encerramento desta fase

- Conta autenticada vê somente seu perfil e cursos publicados de seu tenant; usuário inativo e tenant suspenso são negados.
- A troca de papel não existe em runtime seguro; CPF não serve como login sem senha.
- Nenhuma API legacy/mockDb é acessível em runtime seguro; dados de produção e outros sistemas não foram tocados.
- Auth, RLS e tenant A/B verificados em banco DEV dedicado; testes unitários, lint, build e E2E documentados.
- PR permanece em review até homologação humana. Fases acadêmicas não integram este plano e não podem ser marcadas READY por sua conclusão.

## Subplanos futuros (não executar nesta fase)

- Fase 2: cursos/versões/aprovações, turmas, matrículas e professor atribuído; requisitos de autoria -> aprovação -> publicação.
- Fase 3: avaliações cronometradas, frequência QR assinada, conclusão e certificados com revogação.
- Fase 4: importação transacional, relatórios verdadeiros, governança, auditoria LGPD, MFA e homologação E2E institucional.

## Handoff

Estado: PLAN_REVIEW. O executor deve confirmar esta fase, seleção de método (subagent-driven ou native) e existência de Supabase DEV dedicado antes de implementar. Se o ambiente DEV não existir, pode fazer tarefas locais do plano, mas não alegar integração/RLS aprovados. Nenhum código de produto foi modificado ao criar este documento.
