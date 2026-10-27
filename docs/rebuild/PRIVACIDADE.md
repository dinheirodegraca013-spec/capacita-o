# Privacidade e LGPD — CapacitaGov

Estado: desenho implementado localmente; validação jurídica e operação remota pendentes.

## Inventário mínimo

| Categoria | Finalidade | Minimização/controle |
|---|---|---|
| Identidade e contato | autenticação, convite e comunicação | e-mail/identificador estritamente necessários; payload da outbox rejeita senha, token, CPF e e-mail |
| Vínculo institucional | autorização multi-tenant e relatórios | memberships e roles isolados por organização; RLS e funções protegidas |
| Aprendizagem | matrícula, progresso, avaliação e certificado | acesso limitado ao aluno, gestor autorizado e funções de domínio |
| Auditoria | rastrear mutações administrativas | eventos tenant-scoped, sem conteúdo sensível desnecessário |

## Direitos e retenção

Pedidos de acesso, correção, exclusão e exportação exigem fluxo institucional aprovado, identificação do titular e revisão humana. Certificados e trilhas podem exigir retenção legal; a organização deve definir prazos antes da produção. A aplicação não deve apagar evidência de auditoria ou certificado válido sem política aprovada.

## Gates antes da produção

- definir controlador, operadores, base legal, prazos e canal de atendimento;
- validar Storage privado, URLs assinadas, exportação CSV e isolamento entre dois tenants em ambiente remoto;
- revisar provedor de e-mail, transferências internacionais e contrato;
- executar revisão jurídica e teste de solicitação do titular.
