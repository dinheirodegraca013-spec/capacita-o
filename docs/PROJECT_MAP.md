# PROJECT MAP

## Status Geral
- Projeto: Plataforma Municipal de Capacitação (CapacitaGov)
- Status geral: Produção Funcional / Auditado e Homologado
- Última atualização: 2026-10-07
- Última funcionalidade implementada: Auditoria completa sob Modo Ciclo Contínuo (linter estrito TS, compilação de produção, validação de rotas, RBAC, emissão segura com QR Code e correção do escopo TS2451 no endpoint de avaliação).
- Próxima funcionalidade: Expansão de relatórios gráficos analíticos e webhooks
- Problemas críticos: Nenhum
- Pendências: Nenhuma pendência impeditiva

## Progresso Geral
- Fundação: 100%
- Autenticação: 100%
- Multi-tenant: 100%
- Área do Aluno: 100%
- Área do Professor: 100%
- Área do Gestor: 100%
- Área do Administrador: 100%
- Cursos: 100%
- EAD: 100%
- Presencial: 100%
- Híbrido: 100%
- Avaliações: 100%
- Certificados: 100%
- Relatórios: 100%
- Segurança: 100%

## Funcionalidades

### Fundação e Arquitetura
- ID: FND-001
  - Nome: Estrutura Base e Sistema de Design Institucional
  - Descrição: Layout minimalista, institucional, WCAG AA, espaçamento amplo, tipografia nítida, zero-pill discipline.
  - Status: [x] CONCLUÍDO
  - Frontend: React 19 + Tailwind CSS + Lucide Icons + Design System
  - Backend: Express full-stack na porta 3000 com middlewares Vite
  - Banco de dados: DDL PostgreSQL e store em memória estruturado
  - Permissões: Público / Todos
  - Testes: Testado e compilado com sucesso
  - Observações: Totalmente responsivo para mobile, tablet e desktop.

### Multi-tenant & Organizações
- ID: ORG-001
  - Nome: Isolamento por Organização (Prefeitura)
  - Descrição: Suporte multi-tenant isolado por organization_id, branding customizado (logo, cores, brasão), governança por prefeitura.
  - Status: [x] CONCLUÍDO
  - Frontend: Switcher de prefeitura e personalização visual
  - Backend: Rotas /api/organizations com filtros por tenant
  - Banco de dados: Tabela `organizations` com RLS
  - Permissões: SuperAdmin (criação global), Gestor (gestão do próprio município)
  - Testes: Testado com Prefeitura de Vitória da Conquista e Prefeitura de Blumenau
  - Observações: RLS configurado no script SQL e no backend.

### Autenticação & Perfis
- ID: AUTH-001
  - Nome: Autenticação e Perfis de Acesso (RBAC com Route Guards)
  - Descrição: Login seguro por CPF ou e-mail, controle de sessão, alternador assistido dos 4 perfis para homologação rápida e bloqueio de travessia indevida de rotas.
  - Status: [x] CONCLUÍDO
  - Frontend: Tela de login, seletor rápido no topo e UnauthorizedGuard
  - Backend: Endpoints /api/auth/login, /api/auth/me, /api/auth/switch-role
  - Banco de dados: Tabelas `users` e sessões
  - Permissões: RBAC estrito (superadmin, gestor, professor, aluno)
  - Testes: Testado bloqueio de acesso de aluno a rotas de gestor/admin
  - Observações: Permite alternar papéis com 1 clique para demonstração.

### Estrutura Organizacional
- ID: ORG-002
  - Nome: Secretarias e Departamentos
  - Descrição: Mapeamento de Secretarias Municipais e Departamentos vinculados ao servidor.
  - Status: [x] CONCLUÍDO
  - Frontend: Gestão no painel do Gestor Municipal
  - Backend: Endpoints /api/secretariats e /api/departments
  - Banco de dados: Tabelas `secretariats` e `departments`
  - Permissões: Gestor Municipal e Admin Geral
  - Testes: Testado com SMAI, SMS, SMED, SEFIN
  - Observações: Base para relatórios setoriais.

### Cursos e Modalidades
- ID: CRS-001
  - Nome: Gestão de Cursos (EAD, Presencial, Híbrido)
  - Descrição: Catálogo completo de cursos, carga horária, instrutor, modalidade e trilhas formativas.
  - Status: [x] CONCLUÍDO
  - Frontend: Grade de cursos, visualizador e catálogo com filtros limpos
  - Backend: API /api/courses
  - Banco de dados: Tabela `courses`
  - Permissões: Admin Geral, Gestor, Professor, Aluno
  - Testes: Testado com cursos das três modalidades
  - Observações: Suporta EAD, Presencial e Híbrido simultaneamente.

- ID: CRS-002
  - Nome: Estrutura EAD (Módulos e Aulas)
  - Descrição: Aulas com player de vídeo embutido, player de áudio, leitor de PDFs e materiais de apoio com registro de progresso.
  - Status: [x] CONCLUÍDO
  - Frontend: Player de vídeo HTML5, áudio e visualizador de documentos com barra de progresso
  - Backend: Persistência de tempo assistido e auto-conclusão em /api/lessons/:id/progress
  - Banco de dados: Tabelas `modules`, `lessons`, `lesson_progress`
  - Permissões: Alunos matriculados, Professores
  - Testes: Testado salvamento de progresso de vídeo e marcação de conclusão
  - Observações: Registra segundos assistidos e último timestamp.

- ID: CRS-003
  - Nome: Gestão Presencial e Turmas
  - Descrição: Turmas, encontros agendados, salas, locais físicos, materiais apostilados e chamada.
  - Status: [x] CONCLUÍDO
  - Frontend: Calendário de encontros, materiais em PDF e controle de frequência
  - Backend: Endpoints /api/classes e /api/meetings
  - Banco de dados: Tabelas `classes`, `meetings`
  - Permissões: Professor, Gestor
  - Testes: Testado visualização de turmas e lista de presença
  - Observações: Mostra data, horário, local e sala.

- ID: CRS-004
  - Nome: Cursos Híbridos (Área Online + Área Presencial)
  - Descrição: Apresenta DUAS ÁREAS: Área 1 ("Parte Online") e Área 2 ("Parte Presencial"), com progresso separado e consolidado.
  - Status: [x] CONCLUÍDO
  - Frontend: Abas claras para Parte Online e Parte Presencial no curso híbrido
  - Backend: Agregação de progresso EAD %, Presencial % e Geral %
  - Banco de dados: Relação entre aulas e encontros do curso
  - Permissões: Aluno, Professor, Gestor
  - Testes: Testado com curso de Governança Digital e Segurança da Informação
  - Observações: Atende integralmente o Requisito 14.

### Frequência e Presença
- ID: ATT-001
  - Nome: Registro de Presença Manual e QR Code com Validação Criptográfica
  - Descrição: Registro de frequência pelo professor em sala e auto-confirmação do aluno via QR Code/Token do encontro com validação estrita no servidor.
  - Status: [x] CONCLUÍDO
  - Frontend: Modal de chamada no painel do Professor, gerador de QR Code com projeção em tela e botão de confirmação no Aluno
  - Backend: /api/meetings/:id/qr-code, /api/attendances/verify-qr, /api/meetings/:id/attendance
  - Banco de dados: Tabela `attendances`
  - Permissões: Professor (gerar/marcar), Aluno (confirmar via token)
  - Testes: Testado geração do QR Code e rejeição de token incorreto
  - Observações: Gera QR Code com biblioteca qrcode nativa e valida token case-insensitive.

### Avaliações e Provas Controladas
- ID: ASMT-001
  - Nome: Banco de Questões
  - Descrição: Questões de múltipla escolha com categorias, dificuldade (Fácil, Médio, Difícil) e explicações legais fundamentadas.
  - Status: [x] CONCLUÍDO
  - Frontend: Visualizador no painel do instrutor
  - Backend: API /api/assessments e banco de questões
  - Banco de dados: Tabelas `questions`, `question_options`
  - Permissões: Professor, Gestor, Admin
  - Testes: Testado com questões da Lei 14.133/21
  - Observações: Reutilizável em avaliações.

- ID: ASMT-002
  - Nome: Avaliação Controlada com Cronômetro no Servidor
  - Descrição: Cronômetro calculado no backend (started_at e expires_at imune a F5), tela cheia, detecção de perda de foco / troca de aba / saída de tela cheia, limite de saídas (máx 3), encerramento e salvamento automático.
  - Status: [x] CONCLUÍDO
  - Frontend: Ambiente focado `ControlledExamRoom` com contagem regressiva, salvamento automático e advertências
  - Backend: /api/assessments/:id/start, /api/assessments/attempts/:id/answer, /api/assessments/attempts/:id/incident, /api/assessments/attempts/:id/finish
  - Banco de dados: Tabelas `assessments`, `assessment_attempts`, `assessment_incidents`
  - Permissões: Aluno matriculado
  - Testes: Testado início, salvamento contínuo de respostas, registro de ocorrências e cálculo de nota final
  - Observações: Atende integralmente os Requisitos 19, 20 e 21.

### Certificação & Validação Pública
- ID: CERT-001
  - Nome: Emissão Automática de Certificados
  - Descrição: Geração com critérios de aprovação (nota >= 70%), código alfanumérico único, QR Code e versão para impressão.
  - Status: [x] CONCLUÍDO
  - Frontend: Documento institucional `CertificateDocument` com brasão municipal e botões de impressão
  - Backend: Emissão em /api/assessments/attempts/:id/finish e listagem em /api/certificates isolada por tenant
  - Banco de dados: Tabela `certificates`
  - Permissões: Sistema / Aluno aprovado
  - Testes: Testado visualização e impressão
  - Observações: Documento elegante e pronto para impressão ou download em PDF.

- ID: CERT-002
  - Nome: Validação Pública de Certificado (/validar-certificado/:codigo)
  - Descrição: Rota aberta para consulta pública de autenticidade por qualquer cidadão ou órgão de controle.
  - Status: [x] CONCLUÍDO
  - Frontend: Página pública `PublicCertificateValidator`
  - Backend: Rota pública /api/certificates/verify/:code
  - Banco de dados: Consulta em `certificates` unindo `users` e `organizations`
  - Permissões: Público (sem login)
  - Testes: Testado com o código pré-emitido `PMVC-2026-LIC-882194`
  - Observações: Respeita a LGPD mascarando o CPF do titular (`***.456.789-**`).

### Gestão de Servidores & Importação
- ID: SRV-001
  - Nome: Cadastro e Importação de Servidores por CSV
  - Descrição: Importador com pré-validação atômica de CPF, e-mail institucional, duplicidades e estrutura de secretaria antes de gravar.
  - Status: [x] CONCLUÍDO
  - Frontend: Assistente de importação no painel do Gestor com botão de exemplo e relatório prévio
  - Backend: /api/servants/import-validate e /api/servants/import-commit
  - Banco de dados: Tabelas `users`, `secretariats`, `departments`
  - Permissões: Gestor Municipal, Admin Geral
  - Testes: Testado fluxo completo com validação de erros e gravação
  - Observações: Atende integralmente o Requisito 31.

### Cursos Obrigatórios & Trilhas Formativas
- ID: TRK-001
  - Nome: Cursos Obrigatórios com Prazos e Alertas
  - Descrição: Definição de obrigatoriedade com prazos fixados e alertas visuais no painel do Aluno.
  - Status: [x] CONCLUÍDO
  - Frontend: Banner sutil de alerta na tela inicial do Aluno e gestão pelo Gestor
  - Backend: Suporte a `is_mandatory` e `due_date` nas matrículas
  - Banco de dados: Tabela `enrollments`
  - Permissões: Gestor, Aluno
  - Testes: Testado exibição do alerta de prazo para o curso da Lei 14.133/21
  - Observações: Atende o Requisito 27.

### Avaliação de Satisfação
- ID: SAT-001
  - Nome: Pesquisa de Satisfação Pós-Conclusão
  - Descrição: Avaliação de 1 a 5 estrelas, utilidade para o serviço público e comentário.
  - Status: [x] CONCLUÍDO
  - Frontend: Modal pós-conclusão no visualizador do curso
  - Backend: /api/courses/:id/evaluation com recálculo automático da média do curso
  - Banco de dados: Tabela `course_evaluations`
  - Permissões: Aluno concluinte
  - Testes: Testado envio de avaliação e cálculo de média
  - Observações: Atende o Requisito 34.

### Auditoria e Logs
- ID: AUD-001
  - Nome: Registro de Auditoria e Conformidade LGPD
  - Descrição: Logs de ações críticas (quem, ação, timestamp, tenant, entidade, detalhes, IP).
  - Status: [x] CONCLUÍDO
  - Frontend: Tabela de auditoria no painel do Administrador Geral
  - Backend: Interceptor /api/audit-logs e gravação automática em todas as mutações
  - Banco de dados: Tabela `audit_logs`
  - Permissões: SuperAdmin, Gestor Municipal
  - Testes: Testado registro de logins, matrículas, início de provas e emissões de certificados
  - Observações: Atende os Requisitos 35 e 37.

## Banco de Dados (Schema PostgreSQL / Supabase)

Todas as 22 tabelas definidas em `/supabase/migrations/20261007_init.sql` com RLS ativado e suporte a isolamento por `organization_id`.

## Rotas da Aplicação

### Rotas Públicas
- `/` — Redirecionamento dinâmico conforme perfil ativo
- `/login` — Login institucional com credenciais e atalhos rápidos para demonstração dos 4 perfis
- `/validar-certificado` e `/validar-certificado/:codigo` — Validador público de autenticidade

### Área do Aluno
- `/aluno` — Início com "Continue de onde parou" e alerta de capacitação obrigatória
- `/aluno/cursos` — Catálogo de cursos com filtros por modalidade (EAD, Presencial, Híbrido)
- `/aluno/curso/:id` — Player integrado (Vídeo, Áudio, PDFs, Encontros Presenciais e Avaliação)
- `/aluno/avaliacao/:id` — Sala de avaliação controlada (Tela cheia, cronômetro de servidor e auto-save)
- `/aluno/certificados` — Emissões homologadas com visualização e impressão
- `/aluno/perfil` — Ficha funcional do servidor com aviso de conformidade LGPD

### Área do Professor / Instrutor
- `/professor` — Turmas ativas, chamada em tempo real e gerador de QR Code
- `/professor/cursos` — Cursos sob instrução do professor
- `/professor/turmas` — Encontros e turmas
- `/professor/presencas` — Registro de chamada e projeção de QR Code
- `/professor/avaliacoes` — Banco de questões e provas

### Área do Gestor Municipal
- `/gestor` — Indicadores municipais da prefeitura
- `/gestor/servidores` — Lista de servidores e importador CSV com pré-validação
- `/gestor/secretarias` — Estrutura de secretarias e departamentos
- `/gestor/cursos` — Cursos municipais e obrigatoriedades
- `/gestor/turmas` — Turmas abertas e ocupação
- `/gestor/certificados` — Certificados emitidos pela prefeitura
- `/gestor/relatorios` — Relatórios analíticos e exportação para impressão

### Área do Administrador Geral
- `/admin` — Visão global multi-tenant
- `/admin/prefeituras` — Cadastro e governança de prefeituras
- `/admin/usuarios` — Usuários globais do sistema
- `/admin/cursos` — Catálogo global de cursos
- `/admin/auditoria` — Trilha de auditoria e conformidade LGPD

## Componentes Principais
- `Header`: Cabeçalho institucional com brasão municipal, seletor de papéis e atalho para validação pública
- `NavigationTabs`: Abas discretas e limpas adaptadas para cada um dos 4 perfis com sincronização de URLs
- `UnauthorizedGuard`: Barreira de segurança visual para rotas não autorizadas por papel
- `StudentHome`: Interface ultra-limpa com "Continue de onde parou" e confirmação de presença por QR Code
- `StudentCourseViewer`: Player de aula multimídia e suporte aos cursos híbridos (Área Online + Área Presencial)
- `ControlledExamRoom`: Sala de avaliação com cronômetro autoritativo do servidor e monitoramento de foco
- `CertificateDocument`: Certificado oficial imprimível com brasão e QR Code
- `PublicCertificateValidator`: Consulta pública de autenticidade sem necessidade de login
- `ManagerDashboard`: Gestão municipal completa com assistente de importação de servidores via CSV
- `InstructorDashboard`: Painel pedagógico com lista de chamada e projeção de QR Code
- `AdminDashboard`: Governança multi-tenant e visualização de trilha de auditoria LGPD

## Storage
- `course-materials`: Armazenamento de apostilas e PDFs
- `organization-logos`: Brasões oficiais das prefeituras
- `certificates-cache`: Cache de certificados gerados

## Permissões (RBAC)
- **SuperAdmin**: Controle global de todas as prefeituras e auditoria de sistema.
- **Gestor Municipal**: Controle exclusivo sobre servidores e turmas de sua prefeitura (`organization_id`).
- **Professor**: Acesso aos cursos e turmas atribuídos, lançamento de presenças e QR Code.
- **Aluno**: Experiência minimalista, cursos matriculados, aulas, provas e certificados.

## Bugs Auditados e Corrigidos
- **BUG-001**: Validação de token em `/api/attendances/verify-qr` aceitava token em branco ou não coincidente.
  - Gravidade: Média
  - Status: Resolvido
  - Causa: Ausência de verificação contra `meeting.qr_secret`.
  - Solução: Implementada validação de igualdade case-insensitive do token institucional com erro 400.
- **BUG-002**: Transposição não autorizada de rotas de painel sem checagem de perfil (ex: Aluno acessando `/admin` por URL direta).
  - Gravidade: Alta
  - Status: Resolvido
  - Causa: Roteador renderizava componentes baseado apenas em prefixo de path sem verificar `user.role`.
  - Solução: Implementado `UnauthorizedGuard` bloqueando visualização e redirecionando para o perfil legítimo.
- **BUG-003**: Sub-rotas de `NavigationTabs` (`/gestor/servidores`, `/gestor/secretarias`, `/professor/avaliacoes`, `/admin/auditoria`, etc.) não sincronizavam abas internas nos painéis.
  - Gravidade: Média
  - Status: Resolvido
  - Causa: Estado local inicializado estaticamente.
  - Solução: Sincronização dinâmica via `currentPath` e `onNavigate`.
- **BUG-004**: Redeclaração de variável de escopo de bloco `user` no endpoint `POST /api/assessments/attempts/:attemptId/finish` em `server.ts` (TS2451).
  - Gravidade: Baixa / Linter
  - Status: Resolvido
  - Causa: Dupla declaração de `const user` no mesmo escopo de função assíncrona.
  - Solução: Refatorado para `currentUser` (sessão ativa) e `studentUser` (titular do registro), isolando variáveis e assegurando compilação estrita e lint sem erros.

## Próximas Tarefas
- P0: Concluído integralmente.
- P1: Concluído integralmente.
- P2: Expansão de relatórios gráficos analíticos por secretaria e departamento.
- P3: Aplicativo mobile nativo offline para servidores de campo.
