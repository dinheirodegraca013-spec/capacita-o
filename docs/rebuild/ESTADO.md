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

## Próxima ação

Fechar as pendências operacionais: SMTP/Auth de convite, observabilidade, preview com dados isolados, CI remoto, recuperação/rollback e auditoria independente final. O plano técnico continua sujeito a evidências, não a aprovação implícita.

## Contexto mínimo para retomar

- Repositório: `https://github.com/dinheirodegraca013-spec/capacita-o`.
- Supabase exclusivo: `zykfvzvydvifuzepujvv`, CAPACITAGOV, ativo; migrations funcionais e hardenings aplicados.
- Vercel: projeto `capacita-o-x5hg`, domínio `https://capacita-o-x5hg.vercel.app/`, deployment READY publicado `dpl_CRyDhAkDad4RptLPSKRZ2qvLwVGJ`, commit `4200978b24c4a6606e7e7997a21eee1d5df66e39`; `/` e `/login` retornaram 200 com HTML Next novo. O deployment automático `dpl_9XVyAaudxQphFsSRARP39KBJgTgP` foi identificado como Vite antigo e não recebeu o alias principal.
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
- Vercel: deployment de produção `dpl_BxqDDmMf97HygLJd2EkmJU2hkos1` concluído no projeto `capacita-o-x5hg`; domínio `https://capacita-o-x5hg.vercel.app/` validado via fetch protegido com `/` e `/login` retornando 200 e conteúdo Next/CapacitaGov. O projeto conserva metadado histórico `framework=vite`, mas o build executado foi `next build` com os arquivos da reconstrução.
- Runtime Vercel corrigido: o projeto não tinha variáveis; `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` foram configuradas como pública/encrypted nos ambientes production/preview/development. Redeploy final `dpl_D8d1S5dZz2L3ztx5ScGEb5SHciPN` ficou READY.
- Jornada autenticada real validada em produção: deployment `dpl_27LxyyfouZGD7ZtRf3AK2U9YHf9z` READY; Playwright **3/3 PASS** após adicionar a rota raiz `/o/[orgId]` (redireciona para `/aluno`) e ajustar os seletores E2E. Conta e organização temporárias foram removidas do Supabase (0 restantes). O push para GitHub continua bloqueado por 403 da credencial local.
- Nova proteção de rota: `/gestao/*` exige papel `manager` no servidor e `/professor` exige `instructor` ou `manager`; typecheck, lint e build passaram. A publicação correspondente ficou READY em `dpl_7KE9Cje9s6YFSVBbXYEZt8VYsj6w`. A tentativa de criar uma segunda conta de teste para provar o bloqueio foi impedida pelo limite de envio de e-mail do Supabase; nenhum dado temporário permaneceu.
- Otimização de banco aplicada: `20261027040000_rls_initplan_optimization`, `20261027041000_fk_indexes` e `20261027042000_fk_indexes_remaining`. `pg_prove` local continua 28/199 PASS; advisor remoto confirmou zero `auth_rls_initplan` e zero FK sem índice. Permanecem somente avisos INFO de índices não utilizados, esperados antes de carga real.
- Procedimento de Vercel formalizado em `docs/rebuild/operations/deploy.md`; preview isolado continua pendente porque o único Supabase autorizado é o projeto remoto de produção.

