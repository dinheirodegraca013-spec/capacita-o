# Recuperação e rollback

- Aplicação: reverter para o commit anterior conhecido e reimplantar a mesma versão de variáveis.
- Rollback de aplicação: o alias principal está no deployment Next `dpl_4LDQwbm6YeGGRES9hYup8zfzq5KM`; o deployment anterior conhecido `dpl_5yKfzvh86PXuCnUucpYiy6q9vhxC` permanece como referência de reversão. A troca do alias é reversível, mas ainda não foi ensaiada em produção para não interromper usuários.
- Banco: migrations são append-only; restaurar backup/point-in-time em ambiente de recuperação e validar pgTAP antes de qualquer promoção.
- Outbox: manter registros `pending`/`failed`, corrigir o provedor e reprocessar com a chave idempotente; nunca duplicar envio manualmente.
- Certificados e auditoria: não apagar registros para corrigir uma publicação; revogar com motivo e registrar a decisão.
- Incidente: preservar logs sem tokens/PII, delimitar tenants afetados, notificar responsáveis e registrar linha do tempo.

Antes da liberação integral ainda faltam backup remoto testado, RTO/RPO aprovados e procedimento de restauração ensaiado. A lista automática de candidatos de rollback da Vercel retornou 403 no conector; os IDs acima foram preservados a partir das promoções confirmadas.

Rechecagem de 27/10/2026: o deployment público atual é `dpl_5SpMeb6u658UAADLp1ZmByTDFEkL`; o rollback de aplicação permanece possível pelos deployments READY anteriores. Backup/restauração do banco e ensaio de RTO/RPO continuam pendentes.

