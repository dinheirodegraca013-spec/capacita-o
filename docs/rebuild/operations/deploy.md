# Publicação e verificação

## Vercel

- Projeto: `capacita-o-x5hg`.
- Root efetivo da reconstrução: `apps/web`.
- Domínio principal: `https://capacita-o-x5hg.vercel.app/`.
- Deployment READY publicado: `dpl_C2WKQiXbhje2kU7bNRofKDHNbp2c` (alias principal `capacita-o-x5hg.vercel.app`; commit implantado `80d1f9744145ac9dc3c23ff511eeb0d6d62ca01d`).
- Variáveis públicas do Supabase estão configuradas em production, preview e development. A chave service role nunca é enviada ao navegador.

## Procedimento de publicação

1. Rodar `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` em `apps/web`.
2. Aplicar migrations append-only no Supabase autorizado e executar `pg_prove` local/CI.
3. Criar deployment protegido, validar `/`, `/login`, recuperação, callback, seleção de organização e rotas profundas com conta temporária; o smoke público atual confirmou as rotas de entrada e recuperação.
4. Promover somente após revisar logs, advisors, entrega Resend e evidências E2E; registrar o ID do deployment em `docs/rebuild/ESTADO.md`.

## Limites atuais

O deployment publicado foi validado em `/`, `/login`, `/admin`, `/recuperar-senha` e `/redefinir-senha`. As jornadas autenticadas ainda exigem credenciais temporárias de homologação; não usar contas pessoais em testes automatizados. Rollback de aplicação é possível pelo deployment READY anterior; restauração de banco/PITR e worker SMTP institucional ainda exigem ensaio documentado.
