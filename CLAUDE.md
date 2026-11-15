# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

CineCatálogo: a Next.js 16 (App Router, React 19, Tailwind 4) catalog of movies and TV series from the TMDB API, with Supabase login and personal lists ("Quero assistir", "Assistindo", "Já assisti"). Deployed on Vercel. Code, identifiers, comments, UI text and commit messages are in Brazilian Portuguese; keep it that way.

## Commands

```bash
npm run dev      # dev server (allowedDevOrigins in next.config.ts lets a phone on the LAN connect)
npm run build
npm run lint     # eslint (flat config, eslint-config-next)
npm test         # vitest run (all tests)
npx vitest run lib/listas.test.ts          # one file
npx vitest run -t "alternarMarcacao"       # by test name
```

Windows gotcha: Vitest fails every suite (`Cannot read properties of undefined (reading 'config')`, "no tests") when the cwd has a lowercase drive letter (`c:\...`, e.g. Git Bash `cd /c/...`). In Bash, `cd "C:/projetos/catalogo-filmes"` first. PowerShell is fine.

## Environment

`.env.local` (see `.env.example`): `TMDB_TOKEN` (TMDB API Read Access Token, required), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Only the publishable key is ever used; never the secret/service_role key. Without the Supabase variables the site still works, just without login and lists: `configSupabase()` returns `null` and every caller must handle that.

## Architecture

- **URL is the state.** The home page (`app/page.tsx`) is driven entirely by search params: `tipo=series`, `streaming`, `busca`, `nota`, `pagina`, `lista`. `lib/parametros.ts` parses/sanitizes them (`lerFiltros`) and builds links (`montarHref`, which resets the page when a filter changes). When `lista` is set, the page shows a personal list from Supabase instead of calling TMDB.
- **TMDB** (`lib/tmdb.ts`, server-only): everything goes through `tmdbGet`, which uses `fetch` with `next: { revalidate: 3600 }` and a 10s timeout, and maps failures to `FilmeNaoEncontradoError` (404) / `TmdbIndisponivelError`. Region is BR, language pt-BR. Movies and series are normalized into the shared `FilmeResumo` shape.
- **Movies vs. series.** `Tipo = "filme" | "serie"`. The same TMDB id can be a movie and a series, so identity is always `(tipo, id)`: see `hrefDoTitulo` (`/filme/{id}`, `/serie/{id}`) and `chaveDoTitulo` (React keys) in `lib/listas.ts`.
- **Supabase auth.** `proxy.ts` (Next 16's replacement for middleware) refreshes the session cookie on every request but never blocks pages. `lib/supabase/servidor.ts` creates the per-request server client; it calls `connection()` because `cacheComponents`/`partialPrefetching` are on and Supabase checks token expiry against `Date.now()`. `lib/usuario.ts` `usuarioAtual()` is React-`cache`d per request and returns `null` on any failure.
- **Marcações (lists).** One table, `public.marcacoes`, PK `(user_id, tipo, filme_id)` (the column is still called `filme_id` but holds series ids too). It stores a snapshot of title/poster/year/rating so a list loads with one query. Per-user filtering relies on RLS, not on `where user_id = ...`. Data access is in `lib/marcacoes.ts`; Supabase errors are logged and rethrown as `MarcacoesIndisponiveisError`.
- **Server Actions** live in `acoes.ts` files under `app/` (`app/marcacoes/acoes.ts`, `app/conta/acoes.ts`). Treat them as public endpoints: validate every argument, and re-fetch title data from TMDB on the server instead of trusting the client. Call `redirect()` outside `try` (it works by throwing).
- **Pure logic vs. I/O.** Rules are kept in side-effect-free modules (`lib/listas.ts`, `lib/parametros.ts`, `lib/formatar.ts`, `lib/conta.ts`, `lib/recomendacoes.ts`), and the I/O modules (`tmdb.ts`, `marcacoes.ts`, `usuario.ts`, `supabase/servidor.ts`) import `server-only`. Tests sit next to the code (`*.test.ts`, node environment, `@` alias = repo root); tests for I/O code mock dependencies with `vi.mock` + `vi.hoisted`.
- Components are Server Components by default; only forms/interactive pieces use `"use client"`.

## Database changes

`supabase/esquema.sql` creates the database from scratch in its final state and must stay idempotent (re-runnable). Changes to an existing database go in `supabase/migracoes/` using expand/contract: local dev, previews and production share **one** Supabase database, so the "expand" migration must keep the currently deployed code working, and "contract" runs only after the new code is live on Vercel. A Supabase MCP server is configured in `../.mcp.json`.

## Workflow

Feature work follows the superpowers flow: design specs in `docs/superpowers/specs/`, implementation plans in `docs/superpowers/plans/` (dated `YYYY-MM-DD-*.md`). Read the relevant spec/plan before continuing a feature.
