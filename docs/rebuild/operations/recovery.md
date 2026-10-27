# Recuperação e rollback

- Aplicação: reverter para o commit anterior conhecido e reimplantar a mesma versão de variáveis.
- Banco: migrations são append-only; restaurar backup/point-in-time em ambiente de recuperação e validar pgTAP antes de qualquer promoção.
- Outbox: manter registros `pending`/`failed`, corrigir o provedor e reprocessar com a chave idempotente; nunca duplicar envio manualmente.
- Certificados e auditoria: não apagar registros para corrigir uma publicação; revogar com motivo e registrar a decisão.
- Incidente: preservar logs sem tokens/PII, delimitar tenants afetados, notificar responsáveis e registrar linha do tempo.

Antes da produção ainda faltam backup remoto testado, RTO/RPO aprovados e procedimento de restauração ensaiado.
