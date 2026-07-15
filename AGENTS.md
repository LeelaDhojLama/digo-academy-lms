<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Digo Academy

This repo is being built into **Digo Academy**, a Learning Management System. Before starting work, read:

- `docs/ROADMAP.md` — scope, confirmed product decisions, and the phased build plan.
- `docs/CODING_STANDARDS.md` — stack decisions and conventions (Next 16, Prisma, Better Auth, Server Actions, S3, roles).

## Locked decisions (do not re-litigate without the user)

- **Stack:** Next.js 16 App Router + TS + Tailwind v4, PostgreSQL via **Prisma**, **Better Auth**, AWS S3, Google Meet API, WebSockets. UI via **shadcn/ui**. Client data via **TanStack Query**; forms via **react-hook-form + Zod**. (More libs may be added as needed.)
- **Architecture:** feature-based — `features/` (per-domain), `shared/` (common components/hooks/utils), `lib/` (db/auth/s3/google infra). Thin `app/` for routing only. Components follow **atomic design** (shadcn primitives = atoms). Code follows **SOLID + DRY**. Features never import another feature's internals; promote shared code to `shared/`.
- **Payment/enrollment is manual** — inquiry pipeline + admin-recorded payments. **No online payment gateway.**
- **"CMS" = the admin area** of this same app (one Next.js app, role-gated dashboards: student/instructor/admin).
- **Google Meet** for live classes (server-side API integration). **S3 video streaming = recorded sessions** watched on demand.

## Working agreements

- Every Server Action / Route Handler re-checks auth + authorization independently (reachable via direct POST).
- Verify framework APIs against `node_modules/next/dist/docs/` — do not code Next.js from memory.
- Get schema changes (Phase 1) reviewed before building on them.
