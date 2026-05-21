# Claude Code — Project Instructions

## Commits & Releases

- **Batch changes** — accumulate multiple fixes/features in `master` without tagging. Only create a release when there is a coherent, meaningful set of changes to announce.
- **Never create a git tag or npm release without explicit user confirmation.** Always ask: "Ready to release as vX.Y.Z?" before tagging.
- **One release per session maximum** unless the user explicitly asks for more.
- Patch bumps (x.x.X) for fixes. Minor bumps (x.X.0) for new features. Never bump for cosmetic or doc-only changes.

## Code Style

- This is a TypeScript ESM CLI project built with `tsup`.
- Run `pnpm typecheck` and `pnpm test` before every commit.
- No comments unless the WHY is non-obvious.

## Project Context

- Published on npm as `initmyrepo` (also aliased `imr`).
- Templates live in `src/registry/` — one file per category.
- Security: all external `repoUrl` values must pass `isSafeGitUrl()` before being used in `git clone`.
