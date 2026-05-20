# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] — 2026-05-20

### Added

- Persist user preferences (`lastPm`, `defaultGit`, `defaultVsCode`) via `conf` — wizard pre-fills from saved prefs on next run
- `initmyrepo update` (`up`) command: auto-detects global package manager and updates to `@latest`
- `--json` flag on `initmyrepo list` for machine-readable output
- Better ENOENT error messages in scaffold: when a command is not found, suggests the install command

## [1.0.3] — 2026-05-20

### Added

- `initmyrepo doctor` (`dr`) command: checks Node.js version (>= 22.13.0), git, and availability of npm / pnpm / yarn / bun with a clear pass/fail summary

## [1.0.2] — 2026-05-20

### Changed

- Remove `imr` short alias (conflicts with existing npm package) and update README accordingly

## [1.0.1] — 2026-05-20

### Changed

- Bundle all dependencies into the output file (`noExternal`) so `npx initmyrepo@latest` starts instantly without a separate install step

## [1.0.0] — 2026-05-20

### Added

- Interactive wizard to scaffold any project in seconds
- 25 built-in templates across 5 categories:
  - **Web** (10): React + Vite, Vue 3 + Vite, Svelte 5 + Vite, SolidJS + Vite, Next.js 15, Astro, SvelteKit, Nuxt 3, Remix, TanStack Start
  - **Mobile** (3): Expo, Expo Router, React Native CLI
  - **Backend** (6): Hono, Fastify, NestJS, Express API, Elysia, tRPC + Fastify
  - **Full-stack** (3): T3 Stack, Better T Stack, Next.js + Payload CMS
  - **Monorepo** (3): Turborepo, Nx Workspace, pnpm Workspace
- Favorites system — save any git URL as a named favorite with an emoji icon
- Custom URL cloning — scaffold from any public git repository
- Auto-detect package manager (npm / pnpm / yarn / bun) from lockfile
- Language (TypeScript / JavaScript) and CSS (TailwindCSS v4 / Vanilla) choices for Vite-based templates
- Git init with initial commit after scaffold
- Open in VS Code option
- `initmyrepo list` command with optional `--category` filter
- `initmyrepo search <query>` command
- `initmyrepo favorites` command to manage saved templates
- `--fav` flag to jump straight to favorites
- `--no-install` flag to skip dependency installation
- `--no-git` flag to skip git initialisation
- `--dry-run` flag to preview steps without creating anything
- `imr` short alias
