# Recuperação e rollback

- Aplicação: reverter para o commit anterior conhecido e reimplantar a mesma versão de variáveis.
- Banco: migrations são append-only; restaurar backup/point-in-time em ambiente de recuperação e validar pgTAP antes de qualquer promoção.
- Outbox: manter registros `pending`/`failed`, corrigir o provedor e reprocessar com a chave idempotente; nunca duplicar envio manualmente.
- Certificados e auditoria: não apagar registros para corrigir uma publicação; revogar com motivo e registrar a decisão.
- Incidente: preservar logs sem tokens/PII, delimitar tenants afetados, notificar responsáveis e registrar linha do tempo.

Antes da produção ainda faltam backup remoto testado, RTO/RPO aprovados e procedimento de restauração ensaiado.


## Evidência de rollback de aplicação — 03/11/2026

O alias principal foi reassociado ao deployment `dpl_C2WKQiXbhje2kU7bNRofKDHNbp2c`; o deployment anterior `dpl_5uXEXEh2ALU5BRXBj23KV9JaUof1` permanece como rollback candidate na Vercel. Em incidente, reassociar `capacita-o-x5hg.vercel.app` ao deployment anterior e validar `/`, `/login` e `/api/v1/context` antes de comunicar a recuperação. O rollback de banco continua não ensaiado: exige backup/PITR e ambiente de recuperação.
