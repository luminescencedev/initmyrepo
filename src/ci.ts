import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { PackageManager, Category } from "./types.js";

// ─── CI content ────────────────────────────────────────────────────────────────

const INSTALL: Record<PackageManager, string> = {
  npm: "npm ci",
  pnpm: "pnpm install --frozen-lockfile",
  yarn: "yarn install --frozen-lockfile",
  bun: "bun install --frozen-lockfile",
};

const BUILD: Record<PackageManager, string> = {
  npm: "npm run build --if-present",
  pnpm: "pnpm build --if-present",
  yarn: "yarn build --if-present",
  bun: "bun run build --if-present",
};

const TEST: Record<PackageManager, string> = {
  npm: "npm test --if-present",
  pnpm: "pnpm test --if-present",
  yarn: "yarn test --if-present",
  bun: "bun test --if-present",
};

/** Categories that have a build step in CI */
const HAS_BUILD: Category[] = ["web", "fullstack", "mobile"];

function pmSetupStep(pm: PackageManager): string {
  if (pm === "pnpm") {
    return `
      - uses: pnpm/action-setup@v3
        with:
          version: latest`;
  }
  if (pm === "bun") {
    return `
      - uses: oven-sh/setup-bun@v2`;
  }
  return "";
}

function ciContent(pm: PackageManager, category: Category): string {
  const nodeCache = pm === "yarn" ? "yarn" : pm === "bun" ? "" : pm;
  const cacheLine = nodeCache ? `\n          cache: '${nodeCache}'` : "";

  const steps = [
    `      - uses: actions/checkout@v4`,
    pmSetupStep(pm).trimEnd(),
    `      - uses: actions/setup-node@v4\n        with:\n          node-version: 22${cacheLine}`,
    `      - run: ${INSTALL[pm]}`,
    `      - run: ${TEST[pm]}`,
    ...(HAS_BUILD.includes(category) ? [`      - run: ${BUILD[pm]}`] : []),
  ]
    .filter(Boolean)
    .join("\n");

  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
${steps}
`;
}

// ─── Generator ─────────────────────────────────────────────────────────────────

export async function generateCi(
  projectPath: string,
  pm: PackageManager,
  category: Category,
): Promise<void> {
  const dir = join(projectPath, ".github", "workflows");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "ci.yml"), ciContent(pm, category), "utf8");
}
