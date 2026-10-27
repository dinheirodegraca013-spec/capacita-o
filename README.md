# CapacitaGov

Reconstrução institucional da plataforma CapacitaGov. A aplicação nova fica em `apps/web` e usa Next.js, TypeScript, Vitest e Supabase como destino de persistência.

## Desenvolvimento

```bash
cd apps/web
npm ci
npm run dev
```

Verificações: `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`.

O código legado na raiz é preservado apenas como referência durante a reconstrução. Não há login de demonstração nem dados fictícios no fluxo principal.
