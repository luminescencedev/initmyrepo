# Changelog

All notable changes to this project will be documented in this file.

## [1.4.1] - 2026-05-21

### Added
- `imr` as a short alias for the `initmyrepo` command

## [1.4.0] - 2026-05-21

### Added
- **Nitro** backend template — standalone universal server by UnJS, edge-ready
- **SvelteKit + Drizzle** fullstack template — SvelteKit with Drizzle ORM pre-selected (interactive)

### Changed
- Remix template: updated description and badge to reflect Vite (Remix v2 uses Vite by default)

## [1.3.0] - 2026-05-21

### Added
- **Hono + Bun** backend template — ultra-fast Hono running on Bun runtime
- **Cloudflare Worker** backend template — edge-first serverless with Wrangler (interactive)
- Tests for `isSafeGitUrl` and `externalToTemplate` security validation

## [1.2.2] - 2026-05-21

### Security
- Block unsafe git URLs (`ext::`, `file://`, etc.) in external registries to prevent `git-remote-ext` RCE
- Validate full schema of templates fetched from remote registries (id, name, description, repoUrl)
- Reject non-HTTPS registry URLs with a warning
- Add URL format validation in `initmyrepo favorites` → Add new flow

## [1.2.1] - 2026-05-20

### Fixed
- Resolve dynamic `require()` crash in bundled ESM output

## [1.2.0] - 2026-05-20

### Added
- `initmyrepo add` — add a new app to an existing monorepo (Turborepo · Nx · pnpm workspace)
- `initmyrepo update` — self-update via the detected package manager
- `--dry-run`, `--no-install`, `--no-git` flags on the main wizard
- External registry support via `.initmyreporc.json`
- Favorites system with icons and persistent storage
- `initmyrepo doctor` command to check prerequisites
- VHS terminal demo GIF

## [1.1.0] - 2026-05-20

### Added
- `initmyrepo list --category <name>` filtering
- `initmyrepo search <query>` command
- `--json` flag on `list` for machine-readable output
- Better T Stack and TanStack Start fullstack templates
- Homebrew formula

## [1.0.0] - 2026-05-20

### Added
- Initial release — interactive wizard to scaffold web, mobile, backend, fullstack, and monorepo projects
- 25 built-in templates across 5 categories
- Favorites, custom git URL support
- CI workflow with GitHub Actions
