# Publicação e verificação

## Vercel

- Projeto: `capacita-o-x5hg`.
- Root efetivo da reconstrução: arquivos de `apps/web` enviados como deployment Next.js.
- Domínio: `https://capacita-o-x5hg.vercel.app/`.
- Último deployment READY: `dpl_4LDQwbm6YeGGRES9hYup8zfzq5KM` (commit `071134959a8d7a843fafe9e5c108434b83b3a93b`).
- Variáveis públicas do Supabase estão configuradas em production, preview e development. A chave service role nunca é enviada ao navegador.

## Procedimento de publicação

1. Rodar `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` em `apps/web`.
2. Aplicar migrations append-only no Supabase autorizado e executar `pg_prove` local/CI.
3. Criar deployment protegido, validar `/`, `/login`, callback, seleção de organização e rotas profundas com uma conta temporária.
4. Promover somente após revisar logs, advisors e evidências E2E; registrar o ID do deployment em `docs/rebuild/ESTADO.md`.

## Limites atuais

O preview isolado com dados não produtivos ainda não foi liberado: o único Supabase autorizado é o projeto `zykfvzvydvifuzepujvv`, e não se deve apontar um preview público para dados de produção sem uma política de homologação separada. Rollback de aplicação é possível pelo deployment READY anterior; restauração de banco e SMTP real ainda exigem evidência operacional.

## Rechecagem operacional — 27/10/2026

O alias público foi atualizado automaticamente para o deployment READY `dpl_5SpMeb6u658UAADLp1ZmByTDFEkL`, commit `5fdd925fc3242fa9ed85c9da2dbaf74a37a85a0a`. Verificações sem sessão: `/ativar-conta` respondeu 200; `GET /api/v1/invitations` respondeu 401; `GET /auth/signout` respondeu 405, confirmando que as rotas Next estão publicadas e protegidas por método/sessão.

