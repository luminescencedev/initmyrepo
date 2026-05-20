import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync } from "fs";
import { join } from "path";
import type { Category, PackageManager } from "./types.js";
import { CATEGORY_LABELS } from "./types.js";
import { TEMPLATES_BY_CATEGORY } from "./registry/index.js";
import { detectPM } from "./pm.js";
import { config } from "./config.js";
import { scaffold } from "./scaffold.js";

// ─── Monorepo detection ────────────────────────────────────────────────────────

type MonorepoType = "turborepo" | "nx" | "pnpm-workspace" | "unknown";

function detectMonorepo(): MonorepoType {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "turbo.json"))) return "turborepo";
  if (existsSync(join(cwd, "nx.json"))) return "nx";
  if (existsSync(join(cwd, "pnpm-workspace.yaml"))) return "pnpm-workspace";
  return "unknown";
}

const MONOREPO_LABELS: Record<Exclude<MonorepoType, "unknown">, string> = {
  turborepo: "Turborepo",
  nx: "Nx",
  "pnpm-workspace": "pnpm workspace",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function tag(text: string): string {
  return pc.bgWhite(pc.black(` ${text} `));
}

const esc = (v: unknown): v is symbol => p.isCancel(v);

function abort(msg = "Cancelled."): never {
  p.cancel(msg);
  process.exit(0);
}

// ─── Command ──────────────────────────────────────────────────────────────────

export async function runAdd(presetName?: string): Promise<void> {
  const monorepo = detectMonorepo();

  if (monorepo === "unknown") {
    console.error(
      pc.red("\n  ✘ No monorepo detected in the current directory.\n") +
        pc.dim(
          "  Run this command from the root of a Turborepo, Nx, or pnpm workspace.\n",
        ),
    );
    process.exit(1);
  }

  p.intro(
    `${tag("initmyrepo add")}  ${pc.dim(MONOREPO_LABELS[monorepo] + " detected")}`,
  );

  // ── App name ──────────────────────────────────────────────────────────────
  let appName = presetName?.trim();
  if (!appName) {
    const answer = await p.text({
      message: "App name",
      placeholder: "my-app",
      validate: (v) => {
        if (!v.trim()) return "Name is required";
        if (!/^[a-zA-Z0-9._-]+$/.test(v))
          return "Use letters, numbers, dots, dashes, underscores";
      },
    });
    if (esc(answer)) abort();
    appName = answer as string;
  }

  // ── Target dir ────────────────────────────────────────────────────────────
  const placement = await p.select({
    message: "Add to",
    options: [
      { value: "apps", label: "apps/", hint: "runnable application" },
      {
        value: "packages",
        label: "packages/",
        hint: "shared library / package",
      },
    ],
  });
  if (esc(placement)) abort();
  const targetDir = join(process.cwd(), placement as string);

  const dest = join(targetDir, appName);
  if (existsSync(dest)) {
    p.log.error(`"${placement}/${appName}" already exists.`);
    abort();
  }

  // ── Category ──────────────────────────────────────────────────────────────
  const catChoice = await p.select({
    message: "Project type",
    options: (Object.keys(CATEGORY_LABELS) as Category[]).map((c) => ({
      value: c,
      label: CATEGORY_LABELS[c],
    })),
  });
  if (esc(catChoice)) abort();

  const templates = TEMPLATES_BY_CATEGORY.get(catChoice as Category)!;

  // ── Template ──────────────────────────────────────────────────────────────
  const tmplChoice = await p.select({
    message: "Template",
    options: templates.map((t) => ({
      value: t.id,
      label: t.badge ? `${t.name}  ${pc.dim(t.badge)}` : t.name,
      hint: t.description,
    })),
  });
  if (esc(tmplChoice)) abort();
  const template = templates.find((t) => t.id === tmplChoice)!;

  if (template.warning) {
    p.log.warn(template.warning);
  }

  // ── Package manager ───────────────────────────────────────────────────────
  const detected = await detectPM();
  const pm = await p.select({
    message: "Package manager",
    initialValue: config.getPrefs().lastPm ?? detected ?? "npm",
    options: [
      { value: "npm", label: "npm" },
      { value: "pnpm", label: "pnpm" },
      { value: "yarn", label: "yarn" },
      { value: "bun", label: "bun" },
    ],
  });
  if (esc(pm)) abort();

  // ── Confirm ───────────────────────────────────────────────────────────────
  p.note(
    [
      `${pc.dim("name")}      ${pc.bold(appName)}`,
      `${pc.dim("location")}  ${pc.dim(join(placement as string, appName))}`,
      `${pc.dim("template")}  ${template.name}`,
      `${pc.dim("manager")}   ${pm as string}`,
    ].join("\n"),
    "Summary",
  );

  const go = await p.confirm({ message: "Add app?", initialValue: true });
  if (esc(go) || !go) abort("Nothing created.");

  // ── Scaffold ──────────────────────────────────────────────────────────────
  try {
    await scaffold({
      projectName: appName,
      template,
      pm: pm as PackageManager,
      targetDir,
      git: false, // monorepo owns the git repo
      install: true,
    });

    p.outro(
      pc.green("✓ Done!") +
        "\n\n" +
        `  ${pc.cyan(`cd ${placement}/${appName}`)}\n`,
    );
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    p.cancel("Add failed.");
    process.exit(1);
  }
}
