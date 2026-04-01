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

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── streetview-vr/      # Google Street View VR WebApp
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Artifacts

### `artifacts/streetview-vr` (`@workspace/streetview-vr`)

Google Street View VR WebApp. A WebXR-compatible (Meta Quest browser) experience that:
- Loads a random Google Street View panorama on startup
- Renders it using the Google Maps JavaScript API StreetViewPanorama
- Shows a floating map panel when "Open Map" is clicked
- Lets users click any location on the map to teleport there in Street View
- Supports device motion/gyroscope for looking around on mobile/VR headsets
- Dark-themed, designed for immersive use

**Required Google APIs (enable in Google Cloud Console):**
- Maps JavaScript API (required)
- Street View Static API (required)
- Places API (for map search autocomplete)

**Env var:** `GOOGLE_MAPS_API_KEY` (Replit Secret) — exposed to Vite via `define` in `vite.config.ts`

Key files:
- `src/lib/maps-loader.ts` — singleton Google Maps JS API loader with auth failure detection
- `src/lib/streetview.ts` — panorama lookup via StreetViewService and metadata API
- `src/components/VRScene.tsx` — StreetViewPanorama renderer with controls
- `src/components/MapPanel.tsx` — floating dark map for navigation
- `src/pages/VRApp.tsx` — main app state, error screens with setup instructions

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
