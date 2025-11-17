## TypeScript/Code Style
- TS strict enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`). Path alias `@/*` -> `src/*`. Uses React 19 JSX runtime.
- ESLint flat config extends `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended, `eslint-plugin-react-refresh` (Vite). Targets browser globals, ECMAScript 2020.
- Use functional React components, hooks; follow React Admin patterns for resources/providers.
- Tailwind utility-first styling with shadcn/ui primitives; keep UI components under `src/components/ui`.

## Testing/Type Safety
- No dedicated test runner configured; types checked via `tsc --noEmit` (`npm run types:check`).

## Misc
- Prefer Supabase-generated types in `src/types/database.types.ts` via `types:generate` scripts (local/remote).
