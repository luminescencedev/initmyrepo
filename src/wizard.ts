import * as p from "@clack/prompts";
import pc from "picocolors";
import { join } from "path";
import { execa } from "execa";
import type {
  Category,
  CssFramework,
  Language,
  PackageManager,
  Template,
} from "./types.js";
import { CATEGORY_LABELS } from "./types.js";
import { TEMPLATES_BY_CATEGORY } from "./registry/index.js";
import { config } from "./config.js";
import { detectPM } from "./pm.js";
import { scaffold } from "./scaffold.js";
import { removeGitDir, gitInit } from "./git.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

const FAVORITE_ICONS = [
  { value: "⭐", label: "⭐  Star" },
  { value: "🚀", label: "🚀  Rocket" },
  { value: "🔥", label: "🔥  Fire" },
  { value: "💎", label: "💎  Diamond" },
  { value: "🛠️", label: "🛠️  Wrench" },
  { value: "📦", label: "📦  Package" },
  { value: "🎯", label: "🎯  Target" },
  { value: "🦄", label: "🦄  Unicorn" },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const esc = (v: unknown): v is symbol => p.isCancel(v);

function abort(msg = "Cancelled."): never {
  p.cancel(msg);
  process.exit(0);
}

function tag(text: string): string {
  return pc.bgWhite(pc.black(` ${text} `));
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export async function runWizard(presetName?: string): Promise<void> {
  // Header
  p.intro(
    `${tag("initmyrepo")}  ${pc.dim("Initialize any project in seconds")}`,
  );

  // ── 1. Project name ────────────────────────────────────────────────────────
  let projectName = presetName?.trim();

  if (!projectName) {
    const answer = await p.text({
      message: "Project name",
      placeholder: "my-project",
      validate: (v) => {
        if (!v.trim()) return "Name is required";
        if (!/^[a-zA-Z0-9._-]+$/.test(v))
          return "Use letters, numbers, dots, dashes, underscores";
      },
    });
    if (esc(answer)) abort();
    projectName = answer as string;
  }

  // ── 2. Category ────────────────────────────────────────────────────────────
  const categoryChoice = await p.select({
    message: "Project type",
    options: [
      ...CATEGORIES.map((c) => ({
        value: c,
        label: CATEGORY_LABELS[c],
        hint: {
          web: "10 frameworks",
          mobile: "Expo · React Native",
          backend: "Hono · Fastify · NestJS · Express · Elysia",
          fullstack: "T3 · Better T · Payload",
          monorepo: "Turborepo · Nx · pnpm workspace",
        }[c],
      })),
      {
        value: "__favorites" as const,
        label: "Favorites",
        hint: `${config.getFavorites().length} saved`,
      },
      {
        value: "__custom" as const,
        label: "Custom URL",
        hint: "Clone any git repository",
      },
    ],
  });
  if (esc(categoryChoice)) abort();

  // ── 3. Template ────────────────────────────────────────────────────────────
  let selectedTemplate: Template | null = null;
  let customRepoUrl: string | null = null;

  if (categoryChoice === "__custom") {
    const url = await p.text({
      message: "Git repository URL",
      placeholder: "https://github.com/user/template",
      validate: (v) => {
        if (!v.trim()) return "URL is required";
        if (!v.startsWith("http") && !v.startsWith("git@"))
          return "Invalid git URL";
      },
    });
    if (esc(url)) abort();
    customRepoUrl = url as string;

    // Offer to save as favorite
    const save = await p.confirm({
      message: "Save to favorites?",
      initialValue: false,
    });
    if (!esc(save) && save) {
      await promptSaveFavorite(customRepoUrl);
    }
  } else if (categoryChoice === "__favorites") {
    const favs = config.getFavorites();
    if (favs.length === 0) {
      p.log.warn('No favorites yet — choose "Custom URL" and save one.');
      abort("No favorites.");
    }

    const favChoice = await p.select({
      message: "Favorite",
      options: [
        ...favs.map((f) => ({
          value: f.id,
          label: `${f.icon}  ${f.name}`,
          hint: f.repoUrl,
        })),
        { value: "__manage", label: pc.red("Manage favorites") },
      ],
    });
    if (esc(favChoice)) abort();

    if (favChoice === "__manage") {
      await manageFavoritesFlow();
      process.exit(0);
    }

    const fav = favs.find((f) => f.id === favChoice)!;
    customRepoUrl = fav.repoUrl;
  } else {
    // Normal category → pick a template
    const templates = TEMPLATES_BY_CATEGORY.get(categoryChoice as Category)!;

    const tmplChoice = await p.select({
      message: "Template",
      options: templates.map((t) => ({
        value: t.id,
        label: t.badge ? `${t.name}  ${pc.dim(t.badge)}` : t.name,
        hint: t.description,
      })),
    });
    if (esc(tmplChoice)) abort();
    selectedTemplate = templates.find((t) => t.id === tmplChoice)!;
  }

  // ── 3b. Language & CSS (if template supports it) ───────────────────────────
  let language: Language = "ts";
  let css: CssFramework = "tailwind";

  if (selectedTemplate?.ask?.language) {
    const langChoice = await p.select({
      message: "Language",
      options: [
        { value: "ts", label: "TypeScript", hint: "recommended" },
        { value: "js", label: "JavaScript" },
      ],
    });
    if (esc(langChoice)) abort();
    language = langChoice as Language;
  }

  if (selectedTemplate?.ask?.css) {
    const cssChoice = await p.select({
      message: "CSS",
      options: [
        { value: "tailwind", label: "TailwindCSS v4", hint: "recommended" },
        { value: "none", label: "Vanilla CSS", hint: "no framework" },
      ],
    });
    if (esc(cssChoice)) abort();
    css = cssChoice as CssFramework;
  }

  // ── 4. Package manager ─────────────────────────────────────────────────────
  const detected = await detectPM();

  const pm = await p.select({
    message: "Package manager",
    initialValue: detected ?? "npm",
    options: [
      {
        value: "npm",
        label: "npm",
        hint: detected === "npm" ? "detected" : undefined,
      },
      {
        value: "pnpm",
        label: "pnpm",
        hint: detected === "pnpm" ? "detected" : undefined,
      },
      {
        value: "yarn",
        label: "yarn",
        hint: detected === "yarn" ? "detected" : undefined,
      },
      {
        value: "bun",
        label: "bun",
        hint: detected === "bun" ? "detected" : undefined,
      },
    ] as const,
  });
  if (esc(pm)) abort();

  // ── 5. Options ─────────────────────────────────────────────────────────────
  const opts = await p.group(
    {
      git: () =>
        p.confirm({ message: "Initialize git repository", initialValue: true }),
      vscode: () =>
        p.confirm({
          message: "Open in VS Code when done",
          initialValue: false,
        }),
    },
    { onCancel: () => abort() },
  );

  // ── 6. Confirm ─────────────────────────────────────────────────────────────
  const targetDir = process.cwd();
  const projectPath = join(targetDir, projectName);
  const templateLabel = selectedTemplate?.name ?? customRepoUrl ?? "?";

  if (selectedTemplate?.interactive) {
    p.log.info(
      pc.yellow("ℹ") +
        `  ${pc.bold(selectedTemplate.name)} will ask you additional questions.\n` +
        `  Docs: ${pc.cyan(selectedTemplate.docs)}`,
    );
  }

  p.note(
    [
      `${pc.dim("name")}      ${pc.bold(projectName)}`,
      `${pc.dim("template")}  ${templateLabel}`,
      `${pc.dim("manager")}   ${pm as string}`,
      `${pc.dim("location")}  ${pc.dim(projectPath)}`,
      `${pc.dim("git")}       ${opts.git ? "yes" : "no"}`,
    ].join("\n"),
    "Summary",
  );

  const go = await p.confirm({
    message: "Create project?",
    initialValue: true,
  });
  if (esc(go) || !go) abort("Nothing created.");

  // ── 7. Scaffold ────────────────────────────────────────────────────────────
  try {
    let finalPath: string;

    if (selectedTemplate) {
      finalPath = await scaffold({
        projectName,
        template: selectedTemplate,
        pm: pm as PackageManager,
        targetDir,
        git: opts.git as boolean,
        install: true,
        language,
        css,
      });
    } else if (customRepoUrl) {
      // Clone custom URL
      const s = p.spinner();
      s.start(pc.dim("Cloning repository"));
      await execa("git", ["clone", "--depth=1", customRepoUrl, projectName], {
        cwd: targetDir,
      });
      s.stop(pc.green("✓") + " Repository cloned");

      if (opts.git as boolean) {
        const s2 = p.spinner();
        s2.start(pc.dim("Initialising git"));
        await removeGitDir(join(targetDir, projectName));
        await gitInit(join(targetDir, projectName));
        s2.stop(pc.green("✓") + " Git initialised");
      }

      finalPath = join(targetDir, projectName);
    } else {
      throw new Error("No template selected.");
    }

    // Open VS Code
    if (opts.vscode as boolean) {
      try {
        await execa("code", [finalPath]);
      } catch {
        p.log.warn(
          'Could not open VS Code — make sure "code" is in your PATH.',
        );
      }
    }

    const pmCmd = (pm as string) === "npm" ? "npm run" : (pm as string);

    p.outro(
      pc.green("✓ Done!") +
        "\n\n" +
        `  ${pc.cyan(`cd ${projectName}`)}\n` +
        `  ${pc.cyan(`${pmCmd} dev`)}`,
    );
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    p.cancel("Scaffold failed.");
    process.exit(1);
  }
}

// ─── Favorites helpers ────────────────────────────────────────────────────────

export async function runFavoriteFlow(presetName?: string): Promise<void> {
  p.intro(`${tag("initmyrepo")}  ${pc.dim("Favorites")}`);

  const favs = config.getFavorites();

  if (favs.length === 0) {
    p.log.warn("No favorites saved yet.");
    p.outro(
      'Use "initmyrepo" → "Custom URL" to save one, or "initmyrepo favorites" to add one.',
    );
    return;
  }

  const favChoice = await p.select({
    message: "Favorite",
    options: [
      ...favs.map((f) => ({
        value: f.id,
        label: `${f.icon}  ${f.name}`,
        hint: f.repoUrl,
      })),
      { value: "__manage", label: "Manage favorites" },
    ],
  });
  if (esc(favChoice)) abort();

  if (favChoice === "__manage") {
    await manageFavoritesFlow();
    return;
  }

  const fav = favs.find((f) => f.id === favChoice)!;

  // Ask project name
  let projectName = presetName?.trim();
  if (!projectName) {
    const answer = await p.text({
      message: "Project name",
      placeholder: fav.name.toLowerCase().replace(/\s+/g, "-"),
      validate: (v) => {
        if (!v.trim()) return "Name is required";
        if (!/^[a-zA-Z0-9._-]+$/.test(v))
          return "Use letters, numbers, dots, dashes, underscores";
      },
    });
    if (esc(answer)) abort();
    projectName = answer as string;
  }

  // Package manager
  const detected = await detectPM();
  const pm = await p.select({
    message: "Package manager",
    initialValue: detected ?? "npm",
    options: [
      {
        value: "npm",
        label: "npm",
        hint: detected === "npm" ? "detected" : undefined,
      },
      {
        value: "pnpm",
        label: "pnpm",
        hint: detected === "pnpm" ? "detected" : undefined,
      },
      {
        value: "yarn",
        label: "yarn",
        hint: detected === "yarn" ? "detected" : undefined,
      },
      {
        value: "bun",
        label: "bun",
        hint: detected === "bun" ? "detected" : undefined,
      },
    ] as const,
  });
  if (esc(pm)) abort();

  const git = await p.confirm({
    message: "Initialize git repository",
    initialValue: true,
  });
  if (esc(git)) abort();

  // Clone
  const targetDir = process.cwd();
  const projectPath = join(targetDir, projectName);

  p.note(
    [
      `${pc.dim("name")}      ${pc.bold(projectName)}`,
      `${pc.dim("template")}  ${fav.icon}  ${fav.name}`,
      `${pc.dim("url")}       ${pc.dim(fav.repoUrl)}`,
      `${pc.dim("location")}  ${pc.dim(projectPath)}`,
    ].join("\n"),
    "Summary",
  );

  const go = await p.confirm({
    message: "Create project?",
    initialValue: true,
  });
  if (esc(go) || !go) abort("Nothing created.");

  try {
    const s = p.spinner();
    s.start(pc.dim("Cloning repository"));
    await execa("git", ["clone", "--depth=1", fav.repoUrl, projectName], {
      cwd: targetDir,
    });
    s.stop(pc.green("✓") + " Repository cloned");

    if (git as boolean) {
      const s2 = p.spinner();
      s2.start(pc.dim("Initialising git"));
      const { removeGitDir, gitInit } = await import("./git.js");
      await removeGitDir(projectPath);
      await gitInit(projectPath);
      s2.stop(pc.green("✓") + " Git initialised");
    }

    const pmCmd = (pm as string) === "npm" ? "npm run" : (pm as string);
    p.outro(
      pc.green("✓ Done!") +
        "\n\n" +
        `  ${pc.cyan(`cd ${projectName}`)}\n` +
        `  ${pc.cyan(`${pmCmd} dev`)}`,
    );
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    p.cancel("Scaffold failed.");
    process.exit(1);
  }
}

async function promptSaveFavorite(repoUrl: string): Promise<void> {
  const name = await p.text({
    message: "Favorite name",
    placeholder: "My Template",
    validate: (v) => (!v.trim() ? "Name required" : undefined),
  });
  if (esc(name)) return;

  const icon = await p.select({
    message: "Icon",
    options: FAVORITE_ICONS,
  });

  config.addFavorite({
    name: name as string,
    repoUrl,
    icon: (esc(icon) ? "⭐" : icon) as string,
  });
  p.log.success("Saved to favorites!");
}

export async function manageFavoritesFlow(): Promise<void> {
  p.intro(`${tag("favorites")}  ${pc.dim("Manage your saved templates")}`);

  const favs = config.getFavorites();

  if (favs.length === 0) {
    p.log.warn("No favorites saved yet.");
    p.outro('Use the "Custom URL" option to save one.');
    return;
  }

  const action = await p.select({
    message: "Action",
    options: [
      { value: "list", label: "List all" },
      { value: "add", label: "Add new" },
      { value: "delete", label: "Delete" },
    ],
  });
  if (esc(action)) abort();

  if (action === "list") {
    p.note(
      favs
        .map(
          (f, i) =>
            `${pc.dim(`${i + 1}.`)} ${f.icon}  ${pc.bold(f.name)}\n   ${pc.dim(f.repoUrl)}`,
        )
        .join("\n\n"),
      `${favs.length} favorites`,
    );
  } else if (action === "add") {
    const url = await p.text({
      message: "Git URL",
      validate: (v) => (!v.trim() ? "Required" : undefined),
    });
    if (!esc(url)) await promptSaveFavorite(url as string);
  } else if (action === "delete") {
    const picks = await p.multiselect({
      message: "Select to delete",
      options: favs.map((f) => ({
        value: f.id,
        label: `${f.icon}  ${f.name}`,
        hint: f.repoUrl,
      })),
      required: false,
    });
    if (!esc(picks) && (picks as string[]).length > 0) {
      for (const id of picks as string[]) config.removeFavorite(id);
      p.log.success(`Deleted ${(picks as string[]).length} favorite(s).`);
    }
  }

  p.outro("Done.");
}
