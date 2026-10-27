# Homologação autenticada

Para fechar T03/T28–T30, a execução precisa de:

- duas contas de teste já confirmadas no Supabase Auth, com e-mail e senha fornecidos por canal seguro;
- uma organização distinta para cada conta, com memberships ativos e papéis de aluno/gestor/instrutor conforme a jornada;
- um remetente e provedor SMTP transacional autorizados, com `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_KEY` e `NOTIFICATION_JOB_SECRET` cadastrados somente como variáveis server-only na Vercel;
- janela autorizada para executar convite, matrícula, aula, avaliação, presença, certificado e relatório, seguida da remoção dos dados sintéticos.

Não enviar service role, chaves SMTP ou senhas nesta conversa, em issues ou no Git. Sem essas credenciais oficiais, os testes públicos e SQL continuam válidos, mas as jornadas autenticadas reais permanecem pendentes.
