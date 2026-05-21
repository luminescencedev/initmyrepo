import { Command } from "commander";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pc from "picocolors";
import { execa } from "execa";
import { showBanner } from "./banner.js";
import { runWizard, manageFavoritesFlow, runFavoriteFlow } from "./wizard.js";
import { runDoctor } from "./doctor.js";
import { runAdd } from "./add.js";
import { config } from "./config.js";
import { ALL_TEMPLATES, TEMPLATES_BY_CATEGORY } from "./registry/index.js";
import { CATEGORY_LABELS } from "./types.js";
import type { Category } from "./types.js";

// ─── Version ──────────────────────────────────────────────────────────────────
const _require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
let version = "1.0.0";
try {
  version = _require(join(__dirname, "..", "package.json")).version;
} catch {
  /* ok */
}

// ─── Program ──────────────────────────────────────────────────────────────────
const program = new Command();

program
  .name("initmyrepo")
  .description(
    "Initialize any project — web, mobile, API, monorepo — in seconds",
  )
  .version(version, "-v, --version")
  .addHelpText("before", "\n");

// ── Default: interactive wizard ───────────────────────────────────────────────
program
  .argument("[project-name]", "Project name (skips the first prompt)")
  .option("--fav", "Jump straight to favorites")
  .option("--no-install", "Skip dependency installation")
  .option("--no-git", "Skip git initialisation")
  .option("--dry-run", "Preview steps without creating anything")
  .action(
    async (
      name?: string,
      opts?: {
        fav?: boolean;
        install?: boolean;
        git?: boolean;
        dryRun?: boolean;
      },
    ) => {
      showBanner(version);
      if (opts?.fav) {
        await runFavoriteFlow(name);
      } else {
        await runWizard(name, {
          noInstall: opts?.install === false,
          noGit: opts?.git === false,
          dryRun: opts?.dryRun,
        });
      }
    },
  );

// ── favorites ─────────────────────────────────────────────────────────────────
program
  .command("favorites")
  .aliases(["fav", "f"])
  .description("Manage your saved template favorites")
  .action(async () => {
    showBanner(version);
    await manageFavoritesFlow();
  });

// ── list ──────────────────────────────────────────────────────────────────────
program
  .command("list")
  .alias("ls")
  .description("List all available templates")
  .option(
    "-c, --category <name>",
    "Filter by category (web|mobile|backend|fullstack|monorepo)",
  )
  .option("--json", "Output as machine-readable JSON")
  .action(async (opts: { category?: string; json?: boolean }) => {
    if (
      opts.category &&
      !TEMPLATES_BY_CATEGORY.has(opts.category as Category)
    ) {
      console.error(
        pc.red(`\n  Unknown category: "${opts.category}"`) +
          pc.dim(`\n  Valid: ${Object.keys(CATEGORY_LABELS).join(" | ")}\n`),
      );
      process.exit(1);
    }

    const categories = (
      opts.category
        ? [opts.category as Category]
        : (Object.keys(CATEGORY_LABELS) as Category[])
    ).filter((c) => TEMPLATES_BY_CATEGORY.has(c));

    if (opts.json) {
      const output = categories.flatMap((cat) =>
        (TEMPLATES_BY_CATEGORY.get(cat) ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          category: cat,
          description: t.description,
          docs: t.docs,
          ...(t.badge ? { badge: t.badge } : {}),
          ...(t.interactive ? { interactive: true } : {}),
        })),
      );
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    showBanner(version);

    for (const cat of categories) {
      const templates = TEMPLATES_BY_CATEGORY.get(cat)!;
      console.log(pc.bold(`\n  ${CATEGORY_LABELS[cat]}\n`));
      for (const t of templates) {
        const badge = t.badge ? pc.dim(` [${t.badge}]`) : "";
        const interactive = t.interactive ? pc.yellow(" ◆ interactive") : "";
        console.log(
          `  ${pc.cyan("◆")} ${pc.bold(t.name)}${badge}${interactive}`,
        );
        console.log(`    ${pc.dim(t.description)}`);
        console.log(`    ${pc.dim(t.docs)}`);
      }
    }

    const favs = config.getFavorites();
    if (favs.length > 0) {
      console.log(pc.bold("\n  ⭐ Favorites\n"));
      for (const f of favs) {
        console.log(`  ${f.icon}  ${pc.bold(f.name)}`);
        console.log(`    ${pc.dim(f.repoUrl)}`);
      }
    }

    console.log();
    console.log(pc.dim(`  ${ALL_TEMPLATES.length} templates available`));
    console.log(pc.dim(`  Config: ${config.getPath()}`));
    console.log();
  });

// ── search ──────────────────────────────────────────────────────────────────
program
  .command("search <query>")
  .alias("s")
  .description("Search templates by name, description or tag")
  .action((query: string) => {
    showBanner(version);
    const q = query.toLowerCase();
    const results = ALL_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.badge?.toLowerCase().includes(q) ?? false),
    );

    if (results.length === 0) {
      console.log(pc.yellow(`\n  No templates found for "${query}"\n`));
      return;
    }

    console.log(pc.bold(`\n  ${results.length} result(s) for "${query}"\n`));
    for (const t of results) {
      const badge = t.badge ? pc.dim(` [${t.badge}]`) : "";
      const interactive = t.interactive ? pc.yellow(" ◆ interactive") : "";
      console.log(`  ${pc.cyan("◆")} ${pc.bold(t.name)}${badge}${interactive}`);
      console.log(`    ${pc.dim(t.description)}`);
      console.log(`    ${pc.dim(t.docs)}`);
    }
    console.log();
  });
// ── add ───────────────────────────────────────────────────────────────────────
program
  .command("add [app-name]")
  .description(
    "Add a new app to an existing monorepo (Turborepo · Nx · pnpm workspace)",
  )
  .action(async (appName?: string) => {
    showBanner(version);
    await runAdd(appName);
  });
// ── doctor ──────────────────────────────────────────────────────────────────
program
  .command("doctor")
  .alias("dr")
  .description("Check that all prerequisites are installed and up to date")
  .action(async () => {
    await runDoctor();
  });
// ── update ────────────────────────────────────────────────────────────────────
program
  .command("update")
  .alias("up")
  .description("Update initmyrepo to the latest version")
  .action(async () => {
    async function hasCmd(cmd: string): Promise<boolean> {
      try {
        await execa(cmd, ["--version"], { stdio: "pipe" });
        return true;
      } catch {
        return false;
      }
    }

    const installArgs: Record<string, string[]> = {
      npm:  ["install", "-g", "initmyrepo@latest"],
      pnpm: ["add",     "-g", "initmyrepo@latest"],
      yarn: ["global",  "add", "initmyrepo@latest"],
      bun:  ["install", "-g", "initmyrepo@latest"],
    };

    let pm = "npm";
    if (await hasCmd("pnpm")) pm = "pnpm";
    else if (await hasCmd("bun")) pm = "bun";
    else if (await hasCmd("yarn")) pm = "yarn";

    console.log(pc.bold(`\n  Updating initmyrepo via ${pm}…\n`));

    try {
      await execa(pm, installArgs[pm]!, { stdio: "inherit" });
      console.log(pc.green("\n  ✔ initmyrepo updated successfully.\n"));
    } catch {
      console.error(
        pc.red("\n  ✘ Update failed.") +
          pc.dim(`\n  Run manually: ${pm} ${installArgs[pm]!.join(" ")}\n`),
      );
      process.exit(1);
    }
  });
program.parse();
