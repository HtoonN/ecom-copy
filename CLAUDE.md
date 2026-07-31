# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # dev server (custom launcher, see Environment below)
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write
npm run db:push      # sync prisma/schema.prisma to the database
npm run db:seed      # seed demo accounts + products (prisma/seed.ts)
npm run prisma:generate  # regenerate Prisma client (also runs on postinstall)
```

There is no test suite.

## Environment

- Every script runs through `--require=./scripts/load-env.cjs`, which loads env vars from `.env` (git-ignored). `.env.example` is a placeholder-only template — copy it to `.env` and fill in real values; never put real credentials in `.env.example`.
- Next.js is invoked via `node node_modules/next/dist/bin/next`, not the `next` CLI; keep that pattern if adding scripts.
- `src/instrumentation.ts` pings the DB on server startup and logs success/failure.
- Seeded logins all use `Password123!`: `customer@`/`vendor@`/`admin@northstar.local`.

## Architecture

Single Next.js (App Router) app serving three roles — CUSTOMER, VENDOR, ADMIN — from one codebase. MariaDB/MySQL via Prisma 7 with the `@prisma/adapter-mariadb` driver adapter (`src/lib/prisma.ts`). Database is Aiven MySQL only — connection config comes from `src/lib/database-config.ts`, which requires `DATABASE_URL` (parses `ssl-mode`; `VERIFY_CA`/`VERIFY_IDENTITY` load a CA cert from `DATABASE_SSL_CA_PATH`) and throws if it's missing. The `scripts/apply-*-schema.cjs` migration scripts and `prisma/seed*.ts` all share this same connection logic (`scripts/db-connection.cjs` for the `.cjs` scripts, `databaseConfig()` directly for the `.ts` seeds) — never hardcode a separate DB connection elsewhere.

- **Prisma client is generated into `src/generated/prisma/`** (custom output path). Import models/enums from `@/generated/prisma/...`, never `@prisma/client`. Regenerate after schema changes.
- **Auth** (`src/lib/auth.ts`): stateless JWT (jose, HS256) in the `northstar_session` cookie. Server components call `requireRole(role?)` (redirects); API routes call `apiSession(role?)` from `src/lib/api.ts` (returns `{ error }` NextResponse or `{ session }`).
- **Pages** under `src/app/` are thin server components that do the role gate, then render a client component from `src/components/` (`Storefront`, `CustomerDashboard`, `VendorDashboard`, `AdminDashboard`). Dashboards fetch their data client-side from the matching role API route.
- **API routes** (`src/app/api/`): one route per role (`customer`, `vendor`, `admin`) handling that dashboard's reads/mutations, plus `products` and `auth/*`. Business logic lives directly in the route handlers with Prisma calls; input validation with zod.
- Roles are the `Role` enum in `prisma/schema.prisma`; vendors own exactly one `Shop` (`ownerId` unique) that scopes their products/coupons/orders.
- **Product/shop images** are hosted on Cloudinary, not stored in the DB. `src/lib/image-upload.ts` is the only file the rest of the app imports from (`uploadImage`/`deleteImage`/`publicIdFromUrl`) — it delegates to a provider under `src/lib/image-providers/` (currently `cloudinary.ts`). To switch image-hosting providers, add a new file there implementing `ImageUploadProvider` and change the one import in `image-upload.ts`; never import a provider SDK directly from route handlers or components. `Product.imageUrls` (JSON array) and `Shop.logoUrl` just store plain URL strings (Cloudinary URLs mixed with external affiliate image URLs for products) — there's no `ProductImage`/`ShopLogo` blob table anymore.
