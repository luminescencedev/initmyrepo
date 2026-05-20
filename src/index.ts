import { Command } from "commander";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pc from "picocolors";
import { showBanner } from "./banner.js";
import { runWizard, manageFavoritesFlow, runFavoriteFlow } from "./wizard.js";
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
  .action(async (name?: string, opts?: { fav?: boolean }) => {
    showBanner(version);
    if (opts?.fav) {
      await runFavoriteFlow(name);
    } else {
      await runWizard(name);
    }
  });

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
  .action(async (opts: { category?: string }) => {
    showBanner(version);

    const categories = (
      opts.category
        ? [opts.category as Category]
        : (Object.keys(CATEGORY_LABELS) as Category[])
    ).filter((c) => TEMPLATES_BY_CATEGORY.has(c));

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

program.parse();
