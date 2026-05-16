# Pulse

A full-stack social media platform (Instagram/Twitter style) where users can post, like, comment, follow people, and get real-time notifications.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/social run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v4 + Framer Motion + Wouter
- API: Express 5
- Auth: Supabase Auth (frontend) + x-user-id header passthrough to backend
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — source-of-truth DB schema (users, follows, posts, likes, comments, notifications)
- `lib/api-spec/` — OpenAPI spec (generates hooks at `lib/api-client-react/src/generated/`)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/social/src/` — React frontend
  - `pages/` — AuthPage, FeedPage, ExplorePage, NotificationsPage, ProfilePage, PostDetailPage, SettingsPage
  - `components/` — PostCard, PostComposer, Sidebar, MobileNav, UserAvatar, Skeleton*
  - `contexts/AuthContext.tsx` — Supabase auth state + sync to Postgres
  - `lib/supabase.ts` — Supabase client (handles swapped env var values)

## Architecture decisions

- Auth pattern: Supabase Auth on the frontend; user synced to Postgres via `POST /api/auth/sync-user` on login; all API routes authenticate via `x-user-id` header
- API contract-first: OpenAPI spec → Orval codegen → typed React Query hooks; no hand-rolled fetchers
- Dark mode forced via `document.documentElement.classList.add("dark")` in `main.tsx` (Tailwind v4 doesn't support `@apply dark`)
- Supabase env vars are stored with swapped values in this environment; `lib/supabase.ts` detects and corrects this at runtime
- Feed: global "For You" feed + following-only feed via separate API endpoints

## Product

- Sign up / sign in with email + password (Supabase Auth)
- Post text content (up to 2200 chars), delete own posts
- Global feed + following-only feed with tab switching
- Like/unlike posts with animated heart button
- Comment on posts (post detail page)
- Follow/unfollow users
- Explore page with suggested users + search by username
- Notifications page (likes, comments, follows) with unread count badge
- User profiles with followers/following tabs
- Settings page to update display name, bio, avatar URL, website
- Responsive: sidebar nav on desktop, bottom tab bar on mobile

## User preferences

- Premium dark design: deep zinc/slate background, violet/indigo accent (primary: hsl(259 94% 61%))
- App name: Pulse
- Mobile-first responsive layout

## Gotchas

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets are stored with their names swapped — `lib/supabase.ts` handles this automatically
- Tailwind v4: use `document.documentElement.classList.add("dark")` in JS, not `@apply dark` in CSS
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
