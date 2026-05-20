// ─── Package Managers ─────────────────────────────────────────────────────────

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

// ─── Template Categories ──────────────────────────────────────────────────────

export type Category = "web" | "mobile" | "backend" | "fullstack" | "monorepo";

export const CATEGORY_LABELS: Record<Category, string> = {
  web: "Web",
  mobile: "Mobile",
  backend: "Backend / API",
  fullstack: "Full-stack",
  monorepo: "Monorepo",
};

// ─── Scaffold Step ────────────────────────────────────────────────────────────

/**
 * A single shell command to execute during scaffolding.
 * `cwd` is relative to the output directory when set.
 */
export interface Step {
  label: string;
  cmd: string;
  args: string[];
  /** Run inside the created project directory */
  inProject?: boolean;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  category: Category;
  name: string;
  description: string;
  /** Badge shown next to name */
  badge?: string;
  /** Official docs URL */
  docs: string;
  /**
   * Return the list of steps to run.
   * Steps are executed in order; the first step is the scaffold command itself.
   */
  steps: (ctx: ScaffoldContext) => Step[];
  /**
   * If true, the scaffold tool is interactive and will ask its own questions.
   * We just run it and let it take over.
   */
  interactive?: boolean;
  /** Which extra options the wizard should ask for this template */
  ask?: {
    language?: boolean;
    css?: boolean;
  };
}

// ─── Scaffold Context ─────────────────────────────────────────────────────────

export type Language = "ts" | "js";
export type CssFramework = "tailwind" | "none";

export interface ScaffoldContext {
  projectName: string;
  pm: PackageManager;
  targetDir: string;
  language?: Language;
  css?: CssFramework;
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export interface Favorite {
  id: string;
  name: string;
  repoUrl: string;
  icon: string;
  addedAt: string;
}

// ─── Wizard Result ────────────────────────────────────────────────────────────

export interface WizardResult {
  projectName: string;
  template: Template;
  pm: PackageManager;
  git: boolean;
  install: boolean;
  openVscode: boolean;
}
