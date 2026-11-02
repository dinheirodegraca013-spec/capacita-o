# Publicação e verificação

## Vercel

- Projeto: `capacita-o-x5hg`.
- Root efetivo da reconstrução: `apps/web`.
- Domínio principal: `https://capacita-o-x5hg.vercel.app/`.
- Preview READY protegido: `dpl_5sKPsiAdsCYDX9MTkcoYp65zZxxC` (commit documentado em `docs/rebuild/ESTADO.md`).
- Variáveis públicas do Supabase estão configuradas em production, preview e development. A chave service role nunca é enviada ao navegador.

## Procedimento de publicação

1. Rodar `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` em `apps/web`.
2. Aplicar migrations append-only no Supabase autorizado e executar `pg_prove` local/CI.
3. Criar deployment protegido, validar `/`, `/login`, recuperação, callback, seleção de organização e rotas profundas com conta temporária.
4. Promover somente após revisar logs, advisors, entrega Resend e evidências E2E; registrar o ID do deployment em `docs/rebuild/ESTADO.md`.

## Limites atuais

O preview é protegido por SSO e não deve apontar para dados de produção sem política de homologação separada. Rollback de aplicação é possível pelo deployment READY anterior; restauração de banco/PITR e worker SMTP institucional ainda exigem ensaio documentado.
