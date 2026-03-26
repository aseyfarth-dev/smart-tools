# Architecture

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.2 | React-based fullstack framework with SSR, API routes, file-based routing |
| Language | TypeScript | 5.9 | Type safety across the entire codebase |
| UI Library | React | 19.2 | Component-based UI |
| Styling | Tailwind CSS | 4.2 | Utility-first CSS framework |
| Components | shadcn/ui | latest | Pre-built, customizable UI components (Button, Card, Input, Label, etc.) |
| Database | Supabase (PostgreSQL) | - | Managed Postgres with REST API, realtime, and Row Level Security |
| Auth | Supabase Auth | - | Email/password authentication, session management via cookies |
| Hosting | Vercel | - | Serverless hosting with automatic deployments |
| Package Manager | pnpm | 10.x | Fast, disk-efficient package management |
| Node.js | Node.js | 20.x (LTS) | Runtime (pinned via `.nvmrc`) |

## Project Structure

```
claude/
├── CLAUDE.md                    # AI assistant instructions
├── PROJECT.md                   # Product requirements & feature specs
├── ARCHITECTURE.md              # This file — tech stack & architecture
├── AGENTS.md                    # Next.js agent guidelines
├── .nvmrc                       # Node version pin (20)
├── .env.local                   # Environment variables (not committed)
├── .env.local.example           # Template for required env vars
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── postcss.config.mjs           # PostCSS (Tailwind)
├── src/
│   ├── proxy.ts                 # Auth proxy (Next.js 16 convention, replaces middleware)
│   ├── app/
│   │   ├── layout.tsx           # Root layout (fonts, metadata, PWA)
│   │   ├── page.tsx             # Home screen — app grid launcher
│   │   ├── globals.css          # Global styles & shadcn/ui theme
│   │   ├── login/
│   │   │   └── page.tsx         # Login page (email/password)
│   │   └── apps/
│   │       ├── word-tracker/    # App 1: Toddler word tracker
│   │       ├── poker-results/   # App 2: Poker results history
│   │       └── poker-session/   # App 3: Live poker session manager
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (button, card, input, label)
│   │   └── shell/               # App shell components (logout button)
│   └── lib/
│       ├── utils.ts             # Utility functions (cn helper)
│       └── supabase/
│           ├── client.ts        # Browser Supabase client
│           ├── server.ts        # Server-side Supabase client
│           └── middleware.ts    # Supabase session management for proxy
└── public/
    ├── manifest.json            # PWA manifest
    └── icons/                   # PWA icons (192x192, 512x512)
```

## Key Patterns

### Authentication Flow
1. `src/proxy.ts` intercepts all requests
2. Refreshes Supabase auth session via cookies
3. Unauthenticated users hitting `/apps/*` are redirected to `/login`
4. Authenticated users hitting `/login` are redirected to `/`
5. Home page (`/`) also checks auth server-side and redirects if needed

### App Isolation
- Each app lives under `src/app/apps/<app-name>/`
- Apps share: auth, UI components (`components/ui/`), Supabase client, styling
- Apps do NOT share: data models, business logic, state
- Each app has its own database tables (prefixed by app name)

### Supabase Client Usage
- **Browser (client components):** `import { createClient } from "@/lib/supabase/client"`
- **Server (server components/actions):** `import { createClient } from "@/lib/supabase/server"`
- **Proxy:** Uses `@/lib/supabase/middleware` for session refresh

### PWA
- `manifest.json` in `/public` enables "Add to Home Screen"
- Standalone display mode for app-like experience
- Service worker can be added later via `@serwist/next` for offline support

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Cost Profile
- **Supabase Free Tier:** 500MB database, 50k monthly active users, 1GB file storage
- **Vercel Free Tier:** 100GB bandwidth, serverless functions, automatic HTTPS
- **Total expected cost:** $0/month for personal use
