# Configuração operacional do Supabase Auth

Projeto: `CAPACITAGOV` (`zykfvzvydvifuzepujvv`)

## URL Configuration

No painel Supabase, abrir **Authentication → URL Configuration** e configurar:

- **Site URL:** `https://capacita-o-x5hg.vercel.app`
- **Redirect URLs:**
  - `https://capacita-o-x5hg.vercel.app/**`
  - `https://capacita-o-x5hg.vercel.app/auth/callback`
  - `https://capacita-o-x5hg.vercel.app/ativar-conta`
  - `https://capacita-o-x5hg.vercel.app/redefinir-senha`

Para desenvolvimento local, adicionar somente quando necessário:

- `http://localhost:3000/**`

## Password security

Em **Authentication → Security and Protection**, habilitar a proteção contra senhas comprometidas. A auditoria remota de 02/11/2026 ainda reporta essa opção desativada.

## Email templates

Os templates nativos devem usar `{{ .ConfirmationURL }}` ou `{{ .RedirectTo }}`. Não inserir `http://localhost:3000` fixo. Os fluxos de recuperação e convite do CapacitaGov já usam Resend e links canônicos públicos.

## Verificação pós-configuração

1. Solicitar recuperação em produção.
2. Confirmar que o e-mail contém `https://capacita-o-x5hg.vercel.app` e não contém `localhost`.
3. Abrir o link uma vez, definir nova senha e validar login.
4. Repetir o convite institucional e confirmar ativação em `/ativar-conta`.
