## Before handing off
- Ensure env values (Supabase URL/anon key) present if required for runtime.
- Run quality gates: `npm run lint`, `npm run types:check`, `npm run build` (tsc -b + vite build) to catch type/bundle issues.
- If Supabase schema changes, regenerate types (`npm run types:generate` or `types:generate:remote`) and update migrations.
- Provide notes on impacted resources/providers/components and any manual steps (e.g., env vars, DB migrations).
