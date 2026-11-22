# KejarSNBT

Personal UTBK-SNBT remediation and 800+ IRT readiness instrument built with Next.js 15 App Router, TypeScript, PostgreSQL + `pgvector`, `ts-fsrs`, KaTeX, QuickJS-WASM, and `9router`.

## Architecture & Phase A Specifications

All architectural, relational/vector schema, routing, pipeline, and design system contracts reside inside `docs/phase-a/`:
- `docs/phase-a/01-architecture.md`: Modular Monolith topology and 4-layer deterministic math sandbox boundaries
- `docs/phase-a/02-schema.sql`: PostgreSQL 16+ and `pgvector` DDL (21 enums, 19 tables, 23 indexes)
- `docs/phase-a/03-9router-matrix.md`: 11-task multi-model routing matrix and Zod schema contracts
- `docs/phase-a/04-pipelines.md`: Vision-First PDF ingestion + 5-second QC Gate + Hybrid RAG (`1.35x` priority boost) and Neuro-Symbolic verification pipeline
- `docs/phase-a/DESIGN.md`: Tactile Mastery Instrument 60-30-10 Light/Dark tokens and WCAG AA contrast verification

## Quick Start

### 1. Local Development (Zero-Config Mode or Docker PostgreSQL)

Install dependencies and start the development server:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without `DATABASE_URL` set, the app runs seamlessly against an automatically seeded `.data/local-state.json` store and `.data/vault-files/` storage so every feature (Skill Tree, Focus Tunnel, QuickJS-WASM sandbox, Brain Vault 5s QC, Simulation) works immediately offline.

To use local PostgreSQL 16 + `pgvector` via Docker:

```bash
docker compose up -d
# Set DATABASE_URL=postgresql://postgres:postgres_local_dev@localhost:54322/kejarsnbt in .env.local
npm run db:migrate
npm run db:seed
```

### 2. Connecting `9router` & Supabase Free Tier

1. Start `9router` locally (default `http://localhost:20128/v1`) and map the 5 virtual aliases in `.env.local`:
   `snbt-embed` (1536 dims), `snbt-fast`, `snbt-vision`, `snbt-reason`, and `snbt-code-math`.
2. When moving to Supabase Free Tier:
   - Copy pooled `DATABASE_URL` and direct `DIRECT_URL` from Supabase into `.env.local` (or Vercel Environment Variables).
   - Create a private Supabase Storage bucket named `brain-vault` and configure `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
   - Execute `npm run db:migrate && npm run db:seed`.

### 3. Deploying to Vercel

1. Expose your `9router` gateway over HTTPS (hosted VPS/container or authenticated Cloudflare Tunnel) and set `NINE_ROUTER_BASE_URL` in Vercel.
2. Add all variables from `.env.example` inside Vercel Project Settings -> Environment Variables.
3. Push to GitHub and deploy directly to Vercel (default `MATH_SANDBOX_DRIVER=quickjs_wasm` runs 100% natively in Vercel Node Runtime without requiring an external Python sidecar).

## Verification Commands

```bash
npm run typecheck
npm test
npm run build
```
