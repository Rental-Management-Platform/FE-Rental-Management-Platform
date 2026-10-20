# Rental Management Platform — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Run the production build   |
| `npm run lint`  | Lint with ESLint           |

## Structure

- `src/app` — routes, layouts, global styles (`globals.css` imports Tailwind)
- `public` — static assets
- Import alias: `@/*` → `src/*`
