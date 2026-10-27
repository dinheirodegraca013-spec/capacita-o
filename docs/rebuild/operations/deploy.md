# Publicação e verificação

## Vercel

- Projeto: `capacita-o-x5hg`.
- Root efetivo da reconstrução: arquivos de `apps/web` enviados como deployment Next.js.
- Domínio: `https://capacita-o-x5hg.vercel.app/`.
- Último deployment READY: `dpl_7KE9Cje9s6YFSVBbXYEZt8VYsj6w`.
- Variáveis públicas do Supabase estão configuradas em production, preview e development. A chave service role nunca é enviada ao navegador.

## Procedimento de publicação

1. Rodar `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` em `apps/web`.
2. Aplicar migrations append-only no Supabase autorizado e executar `pg_prove` local/CI.
3. Criar deployment protegido, validar `/`, `/login`, callback, seleção de organização e rotas profundas com uma conta temporária.
4. Promover somente após revisar logs, advisors e evidências E2E; registrar o ID do deployment em `docs/rebuild/ESTADO.md`.

## Limites atuais

O preview isolado com dados não produtivos ainda não foi liberado: o único Supabase autorizado é o projeto `zykfvzvydvifuzepujvv`, e não se deve apontar um preview público para dados de produção sem uma política de homologação separada. Rollback de aplicação é possível pelo deployment READY anterior; restauração de banco e SMTP real ainda exigem evidência operacional.
