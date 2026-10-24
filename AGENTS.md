<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rental Management Platform (frontend)

Web UI for a rental listings marketplace (guests, landlords, admins). The backend is done; its contract is `api-for-frontend.md`. Decisions live in `docs/specs/`, the plan in `docs/scope/`.

## Stack

- **Language / Runtime**: TypeScript 5 (strict), React 19.3, Node.js runtime (not edge)
- **Framework**: Next.js 16.4 App Router (`cacheComponents`, `partialPrefetching`), Tailwind 4
- **Key dependencies**: TanStack Query 5, Zod 4, React Hook Form, native `fetch`, `next/image`
- **Package manager**: npm
- Source: [spec 0001](docs/specs/0001-stack-and-architecture/index.md)

## Build approach

**Tracer Bullet**: run one thin, real thread through every layer first, then thicken it piece by piece; each step still runs end to end. Mirrors the scope header in `docs/scope/index.md`.

## Commands

```bash
npm install
npm run dev     # http://localhost:5173, the API must run at NEXT_PUBLIC_API_URL
npm run build   # needs the API running and seeded
npm run check   # lint + typecheck + format:check + contrast, run before every commit
npm run contrast  # WCAG contrast of the token pairs in src/app/globals.css (part of check)
npm run format  # Prettier write (also: lint, typecheck, format:check)
```

## Specs

Stored in `docs/specs/`, one folder per decision: `docs/specs/NNNN-title/index.md`.

## Rules

- Style: functional. Pure functions by default, side effects (fetch, storage, navigation) at the edges (hooks, Server Components, handlers), no mutable module state, composition over classes.
- Types: TypeScript `strict`, no `any` (ESLint errors on it). Expected API failures use the typed `ApiError` (`src/lib/api/errors.ts`, spec 0002). API fields keep the backend's `null`.
- Layout: `src/features/<name>/{components,api,hooks,schemas}`, shared UI in `src/components`, shared code in `src/lib`, routes in `src/app` (groups `(public)`, `(auth)`, `(landlord)`, `(admin)`).
- Data: the server reads public data as a guest and never holds a token. Anything that needs a login runs in the browser with the access token in memory only.
- Env: read only through `src/lib/env.ts` (browser) and `src/lib/env.server.ts` (server only), both validated with Zod.
- Forms: React Hook Form + Zod for light checks. The backend is the real validator, so map its `errors[].field` onto fields.
- UI: Vietnamese only, `vi-VN` money and area, dates in `Asia/Ho_Chi_Minh`, accessibility baseline WCAG AA.
- Design system: build all UI to `design.md` (art direction and build mandate); token values live in `src/app/globals.css`.
- Tokens: semantic classes only (`bg-primary`, `text-muted-foreground`), no raw colors. A new text or control color pair is added to `scripts/check-contrast.mjs`, or `npm run check` fails.
- Components: shared UI is in `src/components/ui` (shadcn/ui on Radix). Add or update one through the shadcn CLI (`npx shadcn@latest add <name>`, never `--all`, never `--overwrite` without approval), then apply the edits listed in spec 0003.
- Type and layout: text weights are 400, 500 and 600 only, sizes come from the `--text-*` tokens, and a page area is a `Card` zone on the `canvas` background (spec 0004).
- The Next.js docs in `node_modules/next/dist/docs/` beat community skills when they disagree.

## Tooling

- ESLint (`eslint-config-next` + `eslint-config-prettier`) and Prettier with Tailwind class sorting. `typecheck` runs `next typegen && tsc --noEmit`.
- Before commit: `npm run check`, which a husky hook (`.husky/pre-commit`) also runs on every commit. CI: none yet.
- Testing gate: typecheck + `/check verify`. A test runner is added by `/test` when wanted.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone
- commit style: Conventional Commits

## Agent skills

- [next-dev-loop](.agents/skills/next-dev-loop/): `vercel/next.js`, verify Next.js behavior in a running app
- [agent-browser](.agents/skills/agent-browser/): `vercel-labs/agent-browser`, browser automation that next-dev-loop uses
- [tanstack-query-best-practices](.agents/skills/tanstack-query-best-practices/): `deckardger/tanstack-agent-skills`, data fetching, caching, mutations
- [react-hook-form](.agents/skills/react-hook-form/): `pproenca/dot-skills`, forms
- [zod](.agents/skills/zod/): `pproenca/dot-skills`, schemas and parsing
- [tailwind-design-system](.agents/skills/tailwind-design-system/): `wshobson/agents`, Tailwind tokens and components (feature #4)
- [shadcn](.agents/skills/shadcn/): `shadcn-ui/ui`, shadcn/ui components, presets and the CLI (feature #4)

MCP servers: figma (connected), next-devtools-mcp (recommended), shadcn (recommended)

Declined: `emilkowalski/skills@ask-sonner`, `addyosmani/web-quality-skills@accessibility`

## Context files

- [src/components/AGENTS.md](src/components/AGENTS.md): shared UI, shadcn components, page frames, shared states and form pieces
- [src/lib/AGENTS.md](src/lib/AGENTS.md): API client, session, form helpers, env and formatters
- [src/app/dev/AGENTS.md](src/app/dev/AGENTS.md): developer only pages (`/dev/ui`, sample screens, session lab), a 404 in production

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
