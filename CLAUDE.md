# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: verify APIs against the bundled docs

This project runs **Next.js 16.2.10** (App Router) with **React 19.2.4** and **Tailwind v4**. Next 16 renamed and changed enough APIs that training-data assumptions are frequently wrong. Before writing framework code, read the relevant file under `node_modules/next/dist/docs/01-app/` (getting-started numbered guides, `02-guides/`, `03-api-reference/`). Upgrade/breaking-change notes live in `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.

Known Next 16 changes that trip up older knowledge:

- **Middleware is now "Proxy"** — the file is `proxy.ts` at the project root (not `middleware.ts`). Same functionality. See `.../16-proxy.md`.
- **`params` and `searchParams` are `Promise`s** in pages/layouts/route handlers and must be `await`ed (e.g. `params: Promise<{ slug: string }>`).

## Commands

```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint (flat config)
```

There is no test setup in this project yet.

## Architecture

- **App Router only.** Application code lives in `app/`. `app/layout.tsx` is the root layout (loads Geist fonts via `next/font/google`, sets `<html>`/`<body>`, exports `metadata`). Route segments are folders under `app/` with `page.tsx`. Components are Server Components by default; add `"use client"` only where interactivity requires it.
- **Styling is Tailwind v4, CSS-first.** There is **no `tailwind.config.js`**. Tailwind is pulled in via `@import "tailwindcss"` in `app/globals.css`, and design tokens (colors, fonts) are declared there in an `@theme inline { ... }` block wired to CSS variables. PostCSS uses `@tailwindcss/postcss` (`postcss.config.mjs`). Add/adjust theme tokens in `globals.css`, not a JS config.
- **TypeScript strict**, `moduleResolution: bundler`. Import from the project root with the `@/*` path alias (e.g. `@/app/...`).
- **ESLint flat config** (`eslint.config.mjs`) composed from `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- Static assets go in `public/` and are referenced by root-relative paths (e.g. `next/image` `src="/next.svg"`).
