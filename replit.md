# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Ripple Labs (`artifacts/ripple-labs`)
React + Vite web app (port 19683, previewPath `/`)

**Pages:**
- `/` — Home page with explore cards (Ripple Method™ free / Purpose Lab paid)
- `/ripple-method` — Free public overview of The Ripple Method™ (6 stages, flow, diagram, CTA)
- `/purpose-lab` — Purpose Lab overview page (static, links to journey)
- `/ripple-journey` — **AI-powered guided journey** (6-stage interactive experience with Claude as guide)

**Key components:**
- `StageChat.tsx` — Streaming SSE chat component for AI conversations
- `RippleMethodDiagram.tsx` — Interactive concentric SVG ripple diagram
- `PurposeStatementBuilder.tsx` — Purpose statement picker/editor (static, in Stage 3 of Purpose Lab overview)

**AI Integration:** Uses Anthropic claude-sonnet-4-6 via Replit AI Integrations proxy (no user API key needed). Charges billed to Replit credits.

### API Server (`artifacts/api-server`)
Express 5 (port 8080)

**Routes:**
- `GET /api/healthz` — health check
- `POST /api/ripple/chat` — Streaming SSE endpoint for AI journey chat. Accepts `{ stage, messages, context }`, returns SSE stream from Claude.

**Lib packages used:**
- `@workspace/integrations-anthropic-ai` — Anthropic SDK client with Replit AI proxy env vars

**Env vars required (auto-set by Replit AI Integrations):**
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`

## Brand Identity
- Deep Teal `#0F2A36`, Ripple Teal `#2F7F7B`, Soft Teal `#5FA8A5`, Soft Aqua `#D7ECEB`
- Gold Accent `#C8A96A`, Cream Base `#F5F1E8`
- Fonts: Playfair Display (headings), Poppins (body), Cormorant Garamond italic (script/taglines)
