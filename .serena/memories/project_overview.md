## Purpose
Production-ready React Admin panel for a multi-tenant SaaS Search service backed by Supabase (PostgreSQL with pgvector) exposing tenants, documents, search logs/analytics, API keys, billing/usage.

## Tech Stack
- React 19 + TypeScript + Vite 7
- React Admin 5 (ra-core, ra-supabase)
- UI: shadcn/ui (Radix), Tailwind CSS
- State/Auth/Data: Supabase client, React Hook Form + Zod
- Tooling: ESLint flat config, TypeScript strict, PWA plugin

## Structure (high level)
- `src/` main app: components/ui (shadcn), layout, resources (React Admin resources tenants/documents/search-logs/api-keys etc.), providers (supabase client/data/auth), pages/dashboard.
- `supabase-setup.sql` DB schema; `migrations/` for Supabase migrations.
- Configs: `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `tailwind.config.js`, `components.json`.

## Notable docs
- README has setup/start instructions.
- Types generation guide referenced in docs/type-generation.md.
- Multiple guides on Typesense, billing, tenant isolation, security, deployment in root markdown files.
