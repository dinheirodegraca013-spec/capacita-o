# CapacitaGov — desenho de migração segura (2026-10-16)

**Estado:** proposta de especificação para revisão. **Não autoriza deploy, aplicação de migrações ou acesso a dados reais.**

## 1. Objetivo e decisões aprovadas
Preservar a interface React existente e substituir progressivamente o backend demonstrativo Express com identidade global e `mockDb` por Supabase Auth + PostgreSQL multi-tenant. Restaurar o fluxo educacional real: elaboração -> aprovação -> publicação; matrícula, provas, presença, QR e certificação governados por regras e testes. Trabalhar em branch isolada, com CI, homologação independente e nenhum deploy automático.

**Critérios de sucesso:** identidade inequívoca por requisição; nenhuma rota aceita identificação ou papel enviado pelo cliente como autoridade; isolamento entre organizações inclusive relacionamentos e Storage; dados persistentes; aprovação pedagógica obrigatória; provas e presença verificadas no servidor; certificado apenas quando todos os critérios forem cumpridos; CI, integração e E2E completos antes de release.

## 2. Estado atual e restrições
- `server.ts` usa `activeUserId` global, login por CPF/e-mail, `/api/auth/switch-role` e arrays do `mockDb`.
- `src/context/AuthContext.tsx` espera `login(emailOrCpf)`, `switchRole` e possui logout somente local.
- `supabase/migrations/20261007_init.sql` contém tabelas iniciais, mas não demonstra políticas RLS adequadas em todas as relações; `public.users.id` não está vinculada de forma comprovada a `auth.users.id`.
- Migração de acesso aos certificados está **versionada mas não aplicada**; o fluxo público requer endpoint próprio com campos limitados.
- O backend legado permanece **bloqueado por padrão** e limitado a loopback com opt-in de demonstração; manter esse bloqueio até a substituição integral.
- Não usar banco de outro projeto, nem dados pessoais reais nos testes; não alterar `main` ou ambiente de produção.

## 3. Decisão arquitetural e alternativas
**Escolhida — migração por fatias verticais com API Express adaptada:** manter UI e rotas durante a transição, mas colocar APIs novas em módulo `src/server/secure/`, verificando credenciais do Supabase por requisição, escopo organizacional e autorização por operação. Nenhuma rota `mockDb` pode ser disponibilizada em ambiente público. Cada módulo só é promovido quando migração, RLS, testes e UI estiverem íntegros.

**Alternativa descartada — reescrita total imediata:** simplificaria fronteiras em tese, mas aumenta risco de regressão e prazo sem evidência.

**Alternativa descartada — apenas ocultar recursos na interface e aplicar JWT superficial:** mantém IDOR e falta de segurança no servidor.

## 4. Fronteiras de confiança, sessões e autorização
1. A autenticação cabe ao Supabase Auth; frontend só utiliza chave publicável, jamais `service_role`.
2. O middleware seguro valida a sessão/token com o provedor e busca o perfil institucional vigente pelo `auth.users.id`; não confia em `role`, `organization_id` ou `user_id` do corpo/query para autorização.
3. `public.users` precisa de vínculo único, obrigatório e auditável com `auth.users`, considerando migração de registros legados por convite/reconciliação administrada, nunca associação automática por CPF/e-mail.
4. Contexto de autorização por requisição inclui `actor_id`, `organization_id`, papel, hierarquia e estado da conta; contas inativas e organizações suspensas são bloqueadas.
5. Perfil de Super Admin é global somente nas ações explicitamente permitidas; gestor respeita hierarquia; professor gerencia apenas conteúdos/turmas atribuídos; aluno acessa apenas matrícula e registros próprios. MFA obrigatório para gestores e Super Admin antes da homologação.
6. Logout revoga sessão no provedor e atualiza a interface; gerenciamento de sessões e bloqueio de emergência são requisitos da release institucional.
7. Erros sem enumeração de CPF/usuário; registros de autenticação e acesso sem PII ou segredos. Limites de tentativas e rate limiting.

## 5. Banco de dados, tenancy e políticas
- Projeto Supabase **DEV dedicado** com migrações versionadas, backups, testes e revisão de permissões antes de qualquer implantação.
- Todas as entidades com escopo organizacional verificam `organization_id` e relações pai/filho; nunca aceitar FK que referencie tenant diferente.
- RLS em todas as tabelas expostas, políticas para `SELECT/INSERT/UPDATE/DELETE` com `USING` e `WITH CHECK` quando adequado; escopos por professor, gestor, aluno e superadmin.
- Revisar funções `SECURITY DEFINER`: schema não exposto, `search_path` fixado, permissões EXECUTE mínimas, auditoria de dependência e funções que consultam `public.users`.
- Arquivos de conteúdo e fotos em Storage privado com políticas consistentes; URLs temporárias apenas para acessos autorizados.
- `audit_logs` é append-only, guarda autor, organização, alvo e motivo; correções são novos eventos. PII minimizada e prazo de retenção parametrizado conforme contrato/base legal.
- Backfill e mudanças no esquema via scripts reversíveis e testes de reconstrução em DEV; nenhum `DROP/TRUNCATE` ou ampliação de privilégios sem autorização específica.

## 6. Contratos e compatibilidade
- `GET /api/auth/me`: somente sessão real; retorna dados mínimos do perfil; `401` quando ausente e `403` se conta bloqueada.
- `POST /api/auth/login`: fluxo atual por CPF/e-mail **descontinuado**; interface deve migrar para autenticação Supabase. CPF não é senha.
- `POST /api/auth/switch-role`: **removido** do contrato seguro. Não existe impersonação via cliente.
- Demais endpoints seguem contratos tipados por módulo (`organizations`, `courses`, `classes`, `assessments`, `attendance`, `certificates`, `imports`) com autorização server-side, dados de tenant, validação de esquema e status adequados.
- Migração compatível por feature flag **apenas em DEV local**; não ativar backend legado em preview pública ou produção. Frontend só chama endpoints seguros depois do corte por módulo.

## 7. Fluxos de domínio
**Cursos e turmas:** professor cria rascunho -> gestor competente analisa/aprova -> publicação gera versão -> turma utiliza snapshot imutável. Retificações são auditadas; Super Admin pode designar instrutores globais conforme atribuição autorizada. Conteúdo compartilhado entre organizações permanece de propriedade central, sem edição indevida.

**Matrícula:** convite, inclusão individual, importação e solicitação exigem vínculo válido e aprovação quando aplicável; duplicatas evitadas de forma transacional. Mudança de turma e suspensão preservam histórico.

**Avaliação:** tentativas com quantidade máxima e início/expiração no servidor; seleção aleatória fixada por tentativa; questões/opções validadas; respostas autossalvas com titularidade; encerramento único e idempotente; correção automática apenas de itens objetivos e revisão humana de discursivos. Logs de incidentes não substituem avaliação justa nem regras de recuperação.

**Presença:** QR assinado com expiração curta, classe/encontro/tenant e aluno matriculado verificados; registro idempotente; revisão de presença manual exige autorização, motivo e trilha imutável.

**Certificados:** emitir apenas com matrícula concluída, carga e módulos, nota/correção, frequência real, requisitos adicionais e aprovação quando configurada. Código imprevisível e único, verificação pública de campos mínimos e estado válido/revogado. Revogação não apaga histórico.

**Importação e relatórios:** dados revalidados em servidor, operações transacionais/idempotentes e filas com resultado de linha; dashboards sem valores fictícios, exportação real, estados vazios honestos.

## 8. Testes e critérios de aceite da migração
- Testes unitários, integração Supabase e E2E por papéis; cada operação sensível tem casos de falha por ausência de sessão, usuário inativo e tenant A -> B.
- Verificar RLS e Storage como usuário autenticado e anônimo; impedir que `service_role` seja usado no navegador.
- Executar testes de concorrência para tentativas, matrículas, certificados e importação; endpoints críticos idempotentes.
- Provas de todo o ciclo: cadastro autorizado -> conteúdo aprovado -> matrícula -> estudo -> avaliação -> presença -> certificado -> validação/revogação.
- Pipeline GitHub Actions: dependências congeladas, tipos, build, testes e gates de integração/E2E com DEV/preview somente quando infraestrutura de teste estiver disponível.
- Homologação exige checklist rastreável a requisitos e logs reais; falha em segurança ou fluxo crítico impede release, independentemente de build verde.

## 9. Sequência de implementação proposta para o futuro plano
A. Levantamento completo de APIs, UI e SQL com rastreabilidade e fixtures sintéticas.
B. Criar e validar Supabase DEV dedicado; migração identidade + política inicial de acesso e teste negativo RLS.
C. Implementar sessão Supabase, `AuthContext` real e `/api/auth/me`; remover login e alternância de papel inseguros no caminho seguro.
D. Migrar APIs por fatias com autorização e transações; cortar `mockDb` de todos os ambientes disponibilizados.
E. Fluxos de cursos, matrícula, provas, presenças, QR, certificação e importação.
F. Relatórios honestos, governança, testes completos e auditoria externa de release.

## 10. Pontos que exigem decisão na fase de plano
- Identificar projeto Supabase de desenvolvimento dedicado e credenciais/configuração por ambiente sem publicar segredos; verificar se é necessário criá-lo.
- Estabelecer estratégia de vínculo para usuários legados (dados demonstrativos serão descartados no ambiente novo; dados institucionais requerem procedimento de migração aprovado).
- Validar campos da verificação pública de certificado e política de privacidade aplicável.
- Consolidar matriz hierárquica de atribuições, critérios de conclusão, cursos obrigatórios e MFA.

## 11. Rollback, segurança e status
Toda etapa mantém branch isolada e rollback via revert de commits + migração compensatória testada em DEV. Jamais restaurar política pública `USING (true)` como rollback de segurança. Nenhuma alteração deste documento altera o banco, autenticação, frontend ou produção.

**STATUS: SPEC_REVIEW** — arquitetura conversacional aprovada; especificação escrita aguarda revisão explícita antes de gerar o plano de implementação.
