# Entrega de e-mail e convites

O CapacitaGov não envia e-mail diretamente a partir do navegador. Eventos são gravados em `notification_outbox` por `enqueue_notification`; o endpoint interno `POST /api/internal/notifications` entrega no provedor configurado e aplica até cinco tentativas com backoff. O endpoint exige `x-notification-job-secret` e nunca expõe `EMAIL_PROVIDER_KEY` ao bundle.

## Configuração necessária

- `NOTIFICATION_JOB_SECRET`: segredo aleatório usado pelo scheduler.
- `EMAIL_PROVIDER_URL`: endpoint HTTPS do provedor transacional.
- `EMAIL_PROVIDER_KEY`: segredo do provedor, somente no ambiente servidor.
- `EMAIL_FROM`: remetente de um domínio verificado no Resend (por exemplo, `CapacitaGov <noreply@gestio.dev.br>`).

Para Resend, use `EMAIL_PROVIDER_URL=https://api.resend.com/emails` e uma chave `sending_access` restrita ao domínio remetente. O worker resolve o e-mail do destinatário via Supabase Auth Admin e envia `from`, `to`, `subject`, `text` e `html` no formato da API Resend.

O scheduler deve chamar o endpoint em intervalo curto e registrar respostas 2xx/5xx. Falhas ficam como `pending` até cinco tentativas; depois passam a `failed` para reprocessamento administrativo. Payloads com senha, token, CPF ou e-mail são rejeitados antes da fila.

## Estado da homologação

O contrato, a idempotência e o retry estão cobertos por testes locais. A entrega SMTP/provedor real permanece pendente de credenciais e domínio remetente verificados; não usar conta pessoal nem inserir segredos no Git.

