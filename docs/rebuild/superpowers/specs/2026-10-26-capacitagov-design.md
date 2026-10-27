# CapacitaGov — produto e arquitetura propostos

Data: 26/10/2026. Estado: desenho para revisão. Decisão confirmada: catálogo central + cursos próprios. Decisões técnicas e regras detalhadas abaixo são propostas do agente, ainda não aprovação do usuário.

## Intenção e resultado

Construir uma plataforma de capacitação para prefeituras, empresas e outras instituições, com administração isolada, professores opcionais, formação autoinstrucional, cursos acompanhados e modalidades EAD, presencial e híbrida. Recuperar os requisitos do legado e construir uma aplicação nova no mesmo repositório.

Sucesso: duas organizações independentes conseguem matricular pessoas, realizar cursos e emitir certificados com dados persistentes e sem acesso cruzado. Uma delas conclui todo o fluxo sem professor. A outra publica um curso próprio com professor e turma híbrida. O gestor acompanha resultados reais de sua instituição.

## Alternativas e ADR-001

| Alternativa | Benefício | Custo/limite | Decisão proposta |
| --- | --- | --- | --- |
| Evoluir React/Vite/Express antigo | Menor mudança inicial | Autorização e persistência de muitos fluxos precisam ser reconstruídas; mantém acoplamento legado | Não recomendada para o pedido de criação do zero |
| Nova aplicação Next.js + Supabase no repositório existente | Uma aplicação web e servidor, adequada à Vercel e às jornadas institucionais | Nova base e migração explícita dos requisitos | Recomendada |
| Implantar um LMS pronto e personalizar | Recursos pedagógicos maduros | Integração e operação próprias; catálogo central e governança exigem adaptações; hospedagem diferente | Reavaliar somente se integração com LMS virar requisito |

Proposta: monólito modular TypeScript, Next.js App Router, React, Tailwind, Supabase Auth/Postgres/Storage e Vercel. Pacotes e runtime terão versões estáveis compatíveis verificadas e fixadas na task T01; evitar depender de versões recordadas. Um gerenciador npm e um lockfile por aplicação nova. Vitest para domínio/contratos, SQL real para autorização, Playwright para jornadas.

Checkout novo em `capacita-o/` no workspace atual, branch de reconstrução criada a partir da main remota observada na execução. Nova aplicação em `apps/web/`; Vercel aponta somente para essa pasta. O legado permanece como referência no histórico/raiz e não será o servidor da nova aplicação. Migrations novas em `apps/web/supabase/`; migrations da raiz antiga não serão aplicadas ao banco vazio por convenção. Sem Turborepo ou microserviços no primeiro ciclo.

## Requisitos e regras

### R01 — Identidade e instituições

Uma pessoa tem uma identidade Supabase Auth e pode ter vínculos em mais de uma instituição. Papéis pertencem ao vínculo, não ao perfil global. Contexto ativo sempre revalidado no servidor; trocar instituição só seleciona vínculo existente. Instituições: prefeitura, empresa ou outra; unidades organizacionais com nomes configuráveis, evitando exigir secretaria para empresa.

Perfis: administrador da plataforma, gestor institucional, professor/tutor e aluno. Gestor pode também aprender. Professor acessa somente ofertas/turmas às quais foi atribuído. Gestor governa sua instituição; curadoria global é atribuição do administrador da plataforma. Acesso global administrativo usa contexto explícito, justificativa e auditoria, sem sessão disfarçada de aluno.

Convite por gestor autorizado, confirmação de e-mail, primeira senha, login, recuperação, saída e revogação de vínculo. Não habilitar cadastro institucional público no primeiro ciclo. Bootstrap do primeiro administrador via procedimento controlado, sem endpoint público. MFA obrigatório para administrador da plataforma e gestor antes de acesso administrativo em produção.

### R02 — Catálogo central e autoria própria

Curso é conteúdo; versão publicada é imutável; oferta é a disponibilização de uma versão para uma instituição. Curso central só aparece para instituições com concessão ativa. Cursos próprios são privados ao tenant por padrão. Gestor não publica globalmente. A autoria/licença do material fica registrada.

Curso central novo começa sem concessões. Conceder acesso não compartilha matrículas, notas, comentários, tentativas ou certificados entre instituições. A oferta pode definir prazo, obrigatoriedade, capacidade, política de inscrição, professores e identidade visual. Não pode alterar nota mínima, presença mínima, aulas obrigatórias, duração de prova ou limite de tentativas da versão publicada; mudar esses critérios exige nova versão pela autoria autorizada. Matrículas fixam versão e regras; mudanças futuras não alteram certificados ou tentativas anteriores.

Retirada de concessão impede novas matrículas. Para matriculados, acesso à versão é mantido até o término da matrícula; revogação emergencial explícita pode bloquear conteúdo e exige justificativa/auditoria. Certificados já emitidos permanecem consultáveis, salvo revogação individual documentada. A aplicação de suspensão da organização bloqueia acessos protegidos; não apaga histórico.

Conteúdo vazio nunca é apresentado como curso pronto. Inicialmente haverá dados sintéticos somente para testes/demonstração. A operação do catálogo real depende de produção ou licenciamento de cursos pelo proprietário.

### R03 — Aprendizagem sem professor e com acompanhamento

`learning_mode`: `self_paced` ou `instructor_led`, independente de `modality`: `ead`, `presencial`, `hibrido`. Autoinstrucional aceita instrutor nulo; autoria e responsável editorial continuam registrados. Curso acompanhado exige pelo menos um professor ativo atribuído antes da abertura da turma. Presencial/híbrido exige encontros e responsável pela chamada, que pode ser gestor autorizado; não exige criar um professor fictício.

Autoria: rascunho → revisão → publicado → arquivado. Módulos e aulas ordenados; vídeo, áudio, PDF, texto e materiais. Publicar exige título, descrição, carga horária positiva, autoria/licença, regras de conclusão e pelo menos uma atividade compatível com a modalidade. Desativar professor não remove conteúdo nem atribui permissões automaticamente.

Matrícula: ativa → concluída/expirada/cancelada. Sempre pertence a uma oferta; para presencial/híbrido ou EAD acompanhado com agenda, pertence também a uma turma dessa mesma oferta e instituição. No EAD autoinstrucional sem agenda, turma é nula. Uma matrícula por pessoa/oferta, mesmo se cancelada; para recursar cria-se nova oferta, que admite nova matrícula e certificado. A turma determina os encontros e a capacidade aplicáveis; sem turma vale a capacidade da oferta. Transferências de turma exigem operação explícita auditada e revalidação dos encontros, sem criar nova matrícula ou apagar presença. Obrigatoriedade e prazo opcionais; autoinscrição somente em ofertas liberadas para aquele tenant e com capacidade disponível. Publicação de curso não matricula pessoas automaticamente. Trilhas ordenam ofertas; uma etapa pode exigir conclusão anterior.

### R04 — Experiência do aluno

Início com continuidade do estudo e prazos, catálogo com busca/filtros, detalhes de curso, biblioteca de matrículas, player com módulos, materiais, progresso, avaliação, agenda e certificados. Estados de carregamento, vazio, falha e acesso negado explícitos. Navegação por teclado, contraste AA, foco visível e uso em celular a partir de 360px. Conteúdos publicados precisam de recursos de acessibilidade aplicáveis, incluindo legendas/transcrições e PDFs adequados, revisados editorialmente.

Vídeo inicial: arquivos MP4 de conteúdo próprio/licenciado em Storage privado, entrega por URL assinada após autorização; upload direto ao Storage com limite inicial configurado de 100 MiB por arquivo, sem proxy de arquivo grande pelas funções Vercel. Materiais PDF/áudio também privados. Não prometer streaming adaptativo, DRM ou download offline; provedor especializado será decisão posterior se tamanho/custo exigir.

Progresso usa matrícula e versão, rejeita aulas de outro curso e timestamps negativos ou além da duração. Retomada e conclusão são idempotentes. Sinal de player não prova atenção ou identidade: progresso é evidência operacional; avaliação/presença seguem regras próprias. Texto/PDF exigem confirmação explícita de leitura, sem inventar tempo assistido.

### R05 — Avaliações e conclusão

Banco de questões separado do contrato entregue ao aluno; gabarito nunca enviado durante tentativa. Limite de tentativas, duração e nota mínima configuráveis. Relógio e correção no servidor; autosave retomável; respostas após expiração recusadas. Início concorrente não cria tentativas extras. Finalização atômica e idempotente.

Regra inicial: todas as aulas obrigatórias concluídas; nota mínima 70% se houver prova; presença mínima 75% se houver encontros obrigatórios. Presença é calculada pelos minutos programados dos encontros obrigatórios não cancelados da turma: minutos de encontros marcados presente / minutos totais aplicáveis. Nesta versão a chamada é integral por encontro; não há crédito parcial. Ausente e justificado contam zero no numerador e permanecem no denominador; mudanças excepcionais exigem correção auditada, não exclusão silenciosa. Encontro obrigatório ainda não encerrado impede conclusão; zero minutos aplicáveis em curso que exige presença gera pendência de configuração, nunca 100%. Valores são propostas e podem ser configurados antes da publicação. Sem prova não existe requisito de nota; sem presencial não existe requisito de presença. Híbrido exige ambos os componentes aplicáveis. Regras ficam congeladas na matrícula.

Incidentes de foco podem ser registrados como informação; não afirmar fiscalização antifraude nem reprovar automaticamente por troca de aba no padrão inicial. Evitar biometria e gravação de câmera nesta versão.

### R06 — Turmas e presença

Encontros têm início/fim, fuso e local ou link. Capacidade não pode ser excedida sob concorrência. Professor atribuído ou gestor pode lançar chamada dentro do tenant. QR/token deve ser aleatório, expirar em 5 minutos e ser vinculado ao encontro e à janela de presença. Exigir matrícula ativa, encontro correto e prevenção de duplicidade. Segredo vazio ou token expirado nunca aceito. Correções de presença auditadas.

### R07 — Certificados

Emissão por serviço transacional após verificação de todos os requisitos aplicáveis, com unicidade por matrícula, snapshot do nome/curso/emissor/carga/regras e código aleatório não sequencial. Documento imprimível e PDF. Validação pública informa apenas código, nome do titular, curso, instituição emissora, carga, data e estado válido/revogado; não expõe CPF, e-mail, matrícula funcional ou notas. Nome público e política de emissão serão informados ao aluno antes da emissão. Revogação exige autorização e motivo; nunca excluir para esconder histórico.

### R08 — Gestão e governança

Pessoas, vínculos, unidades, importação CSV com prévia, revalidação transacional e identificação idempotente de lote. Padrão até 500 linhas e 2 MiB por lote nesta versão. Matrículas e convites têm resultado separado; falha no e-mail é recuperável. CPF opcional e nunca usado como credencial. Exportação protege contra fórmulas CSV.

Relatórios por curso, unidade e período: matriculados, ativos, concluintes, pendentes, horas concluídas e conclusão por prazo. Denominadores explícitos e excluindo cancelados quando aplicável. Dados vazios exibem zero/sem dados, nunca números inventados. Satisfação após conclusão: uma avaliação por matrícula, 1–5 e comentário opcional.

Auditoria de ações sensíveis com ator, tenant, recurso, ação, resultado e data; escrita por servidor/banco e leitura restrita. Sem tokens, senhas, CPF ou conteúdo de resposta nos logs. Política de retenção e solicitações de acesso/exportação/eliminação precisam de responsável institucional antes de produção; não alegar conformidade legal apenas pela existência de logs.

### R09 — Fronteiras técnicas

`profiles(auth_user_id)` representa identidade; `organizations`, `org_units`, `memberships`, `membership_roles` representam acesso; `platform_admins` representa privilégio global. `courses`, `course_versions`, `modules`, `lessons`, `assets` representam conteúdo. `course_grants`, `offerings`, `instructor_assignments`, `enrollments`, `lesson_progress` representam uso institucional. `learning_paths`, `path_items`, `class_groups`, `meetings`, `attendances`, `assessments`, `questions`, `question_options`, `attempts`, `attempt_answers`, `certificates`, `course_evaluations`, `invitations`, `import_batches`, `notification_outbox`, `audit_events` completam os módulos.

Todas as relações institucionais carregam `organization_id`; FKs compostas impedem vínculos entre tenants. Conteúdo central pode ser lido por concessão válida ou matrícula preservada; mutação de conteúdo central é exclusiva da curadoria global. Conteúdo institucional usa proprietário e vínculo ativo. RLS em todas as tabelas expostas e nos objetos Storage, inclusive leitura indireta e funções. Revogar `EXECUTE` público de rotinas privilegiadas. Gabaritos e auditoria de escrita ficam em área privada.

Leituras protegidas e mutações usam cliente Supabase do usuário autenticado e validação no servidor. Service role somente para rotinas administrativas delimitadas, nunca como cliente genérico para todo CRUD. Autorizar por memberships no banco, sem confiar em `user_metadata` ou tenant vindo do formulário. Não usar cache compartilhado de dados autenticados; chaves e invalidação devem incluir instituição e identidade quando houver cache.

Fronteiras de execução: navegador → Route Handler/Server Action validada → serviço de domínio → Supabase com RLS/transação. Funções SQL para concorrência de matrícula, início/final de prova e emissão; não dividir essas operações críticas em múltiplas gravações independentes. Outbox para notificações, retry limitado e chave idempotente; nenhuma promessa de entrega exatamente uma vez pelo provedor.

### R10 — Publicação e operação

Desenvolvimento/testes em Supabase local com dados sintéticos; projeto remoto informado é destino exclusivo do CapacitaGov, mas ambiente e política de uso devem ser definidos antes de aplicar migrations. Preview não utiliza dados de produção. Vercel será criada/vinculada em task própria, depois da base local revisada. Sem mudar outros projetos.

Gate de produção: jornadas de duas organizações em banco real, testes de RLS/Storage, avaliação/concorrência/certificação, SMTP real em caixa autorizada, acessibilidade e navegador, dependências, ausência de segredos, migração reprodutível, recuperação documentada e aprovação do desenho/ambiente de publicação. Reversão da aplicação por deployment anterior; correções de dados por migration aditiva, sem reset remoto.

## Evolução posterior

P2: comercialização de planos institucionais, checkout/afiliados/marketplace, SSO corporativo, SCORM/xAPI/LTI, aplicativos nativos/offline, streaming especializado, tutoria por IA baseada em materiais aprovados, domínio próprio por instituição e integrações RH. São extensões; não entram implicitamente nas tasks iniciais.

## Decisões deixadas ao executor

Escolher componentes acessíveis, nomes locais e otimizações pequenas sem alterar contratos. Consultar documentação e fixar versões na execução. Não retomar pesquisa inteira ao trocar modelo. Mudanças em ownership, emissão de certificado, fornecimento de cursos ou autorização precisam atualizar este desenho e as tasks afetadas.
