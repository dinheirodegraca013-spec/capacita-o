# Runbook de release

1. Confirmar branch, revisão independente e working tree limpo.
2. Executar migrations em banco de homologação restaurável; registrar versão e resultado.
3. Configurar Supabase Auth, Storage, remetente de e-mail, `NOTIFICATION_JOB_SECRET`, `EMAIL_PROVIDER_URL` e `EMAIL_PROVIDER_KEY` por ambiente.
4. Executar unit, pgTAP, typecheck, lint, build, Playwright autenticado e teste RLS com dois tenants.
5. Criar preview Vercel somente após autorização e registrar URL, commit e variáveis usadas.
6. Produção exige aprovação explícita, backup verificado, janela de mudança e plano de rollback.

Estado atual: gate bloqueado. O projeto Supabase está ativo, mas sem migrations remotas; não há projeto Vercel; não houve deploy.
