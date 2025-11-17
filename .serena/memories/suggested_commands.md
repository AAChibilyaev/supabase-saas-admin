## Setup
- Install deps: `npm install`
- Copy env: `cp .env.example .env` then fill Supabase URL/anon key

## Development
- Start dev server: `npm run dev` (Vite on 5173)
- Preview build: `npm run preview`

## Quality
- Lint: `npm run lint`
- Type check: `npm run types:check`
- Build (includes project references): `npm run build` (runs `tsc -b` then `vite build`)

## Supabase/DB
- Start local stack: `npm run supabase:start`; stop/status/restart similar
- Reset DB: `npm run db:reset`
- Migrations: `npm run db:migration:new|up`; diff/push/pull via `db:diff`, `db:push`, `db:pull`
- Link/login: `npm run supabase:link|login`
- Generate types: `npm run types:generate` (local) or `npm run types:generate:remote`
