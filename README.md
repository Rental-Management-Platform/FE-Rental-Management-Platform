# Rental Management Platform — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS v4.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app uses port 5173 because the API
owns 3000 and its `ALLOWED_ORIGINS` already lists `http://localhost:5173`. Use `localhost`
on both sides, never `127.0.0.1` (the refresh cookie is tied to the host). The API must be
running at `NEXT_PUBLIC_API_URL`.

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Run the production build   |
| `npm run lint`  | Lint with ESLint           |

## Structure

- `src/app` — routes, layouts, global styles (`globals.css` imports Tailwind), and the providers mount
- `src/lib` — shared code: `env.ts` (browser safe values), `env.server.ts` (server only)
- `public` — static assets
- Import alias: `@/*` → `src/*`
