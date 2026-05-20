import { readdir } from "fs/promises";
import type { PackageManager, Step } from "./types.js";

// ─── Detection ────────────────────────────────────────────────────────────────

export async function detectPM(): Promise<PackageManager | undefined> {
  try {
    const files = await readdir(process.cwd());
    if (files.includes("bun.lockb") || files.includes("bun.lock")) return "bun";
    if (files.includes("pnpm-lock.yaml")) return "pnpm";
    if (files.includes("yarn.lock")) return "yarn";
    if (files.includes("package-lock.json")) return "npm";
  } catch {
    /* ignore */
  }
}

// ─── Command builders ─────────────────────────────────────────────────────────

/**
 * Build a `pm install` step.
 */
export function installStep(pm: PackageManager): Step {
  return {
    label: "Installing dependencies",
    cmd: pm,
    args: ["install"],
    inProject: true,
    type: "install",
  };
}

/**
 * Build a `pm add -D <deps>` step.
 */
export function addDevStep(pm: PackageManager, ...deps: string[]): Step {
  return {
    label: `Adding ${deps.join(", ")}`,
    cmd: pm,
    args:
      pm === "npm"
        ? ["install", "--save-dev", ...deps]
        : ["add", "-D", ...deps],
    inProject: true,
    type: "install",
  };
}

/**
 * `npx` / `pnpm dlx` / `yarn dlx` / `bunx`
 */
export function dlx(
  pm: PackageManager,
  pkg: string,
  ...args: string[]
): { cmd: string; args: string[] } {
  switch (pm) {
    case "pnpm":
      return { cmd: "pnpm", args: ["dlx", pkg, ...args] };
    case "yarn":
      return { cmd: "yarn", args: ["dlx", pkg, ...args] };
    case "bun":
      return { cmd: "bunx", args: [pkg, ...args] };
    default:
      return { cmd: "npx", args: [pkg, ...args] };
  }
}

/**
 * `npm create X` / `pnpm create X` / `yarn create X` / `bun create X`
 *
 * For npm, passes `--` before extra args so flags go to the underlying tool.
 */
export function create(
  pm: PackageManager,
  pkg: string,
  ...args: string[]
): { cmd: string; args: string[] } {
  switch (pm) {
    case "pnpm":
      return { cmd: "pnpm", args: ["create", pkg, ...args] };
    case "yarn":
      return {
        cmd: "yarn",
        args: ["create", pkg.replace("@latest", ""), ...args],
      };
    case "bun":
      return { cmd: "bun", args: ["create", pkg, ...args] };
    default:
      return {
        cmd: "npm",
        args: ["create", pkg, ...(args.length ? ["--", ...args] : [])],
      };
  }
}
