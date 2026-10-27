# Runbook de release

1. Confirmar branch, revisão independente e working tree limpo.
2. Executar migrations em banco de homologação restaurável; registrar versão e resultado.
3. Configurar Supabase Auth, Storage, remetente de e-mail, `NOTIFICATION_JOB_SECRET`, `EMAIL_PROVIDER_URL` e `EMAIL_PROVIDER_KEY` por ambiente.
4. Executar unit, pgTAP, typecheck, lint, build, Playwright autenticado e teste RLS com dois tenants.
5. Criar preview Vercel somente após autorização e registrar URL, commit e variáveis usadas.
6. Produção exige aprovação explícita, backup verificado, janela de mudança e plano de rollback.

Estado atual: aplicação Next publicada no projeto Vercel `capacita-o-x5hg` e migrations aplicadas no Supabase `zykfvzvydvifuzepujvv`. O gate final permanece bloqueado somente pelas evidências operacionais ainda ausentes (contas E2E de homologação, SMTP/worker, backup/restauração, rollback ensaiado e auditoria independente final).

Rechecagem 27/10/2026 13:27 BRT: produção está em `dpl_22Se4nQk3QNP8o53JR5EmczqoigE` (`c35a1a4`); `/api/v1/auth/recover` ainda não existe no alias público. Não considerar a correção de links de recuperação liberada até o deployment do patch.

