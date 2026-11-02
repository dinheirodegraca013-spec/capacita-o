# Runbook de release

1. Confirmar branch, revisão independente e working tree limpo.
2. Executar migrations append-only em banco de homologação restaurável; registrar versão e resultado.
3. Configurar Supabase Auth, Storage, remetente de e-mail, `NOTIFICATION_JOB_SECRET`, `EMAIL_PROVIDER_URL` e `EMAIL_PROVIDER_KEY` por ambiente.
4. Executar unit, pgTAP, typecheck, lint, build, Playwright autenticado e teste RLS com dois tenants.
5. Criar preview Vercel protegido, validar rotas públicas e profundas, e registrar URL, commit e variáveis usadas.
6. Produção exige aprovação explícita, backup verificado, janela de mudança e plano de rollback.
7. Após a janela, confirmar logs do worker, entrega no Resend e ausência de `localhost` nos links.

## Estado atual

Código e migrations estão em `feat/capacitagov-rebuild`; CI web/pgTAP está verde e há preview READY protegido por SSO. O gate integral permanece aberto: backup/PITR ensaiado, worker institucional Resend, proteção de senhas comprometidas e auditoria final independente ainda precisam de evidência operacional. Não promover sem esses registros.
