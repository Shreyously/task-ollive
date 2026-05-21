# LLM Observability Platform

Lightweight, production-style monorepo scaffold for multi-provider LLM inference and observability.

## Stack

- Frontend: React + Vite + Tailwind + TanStack Query
- API: NestJS
- Worker: BullMQ consumer
- Data: PostgreSQL + Prisma (integration-ready)
- Queue: Redis + BullMQ
- LLM SDK: Vercel AI SDK (`@ai-sdk/google`, `@ai-sdk/groq`)
- Infra: Docker Compose

## Monorepo

```text
apps/
  frontend/
  api/
  worker/
packages/
  inference-sdk/
  shared-types/
tooling/
  tsconfig/
```

## Bootstrap

1. Install Node.js 20.11+.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Create env file:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Run all workspace dev scripts:
   ```powershell
   npm run dev
   ```

## Root Scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm run format`

## Environment Strategy

- `.env.example` is the required variable contract.
- Keep provider secrets server-side only (API/worker).
- Frontend-exposed keys must start with `VITE_`.
- Redaction config stays explicit and environment-driven.

## Next Integration (No Business Logic Yet)

- Add Prisma schema/migrations and DB client wiring.
- Add BullMQ producers in API and consumers in worker.
- Add shared event contracts + correlation IDs in `packages/shared-types`.
- Add provider router boundaries in API and ingestion SDK hooks.

