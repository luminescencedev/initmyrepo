import { execa } from "execa";
import { join } from "path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import type {
  Template,
  PackageManager,
  Language,
  CssFramework,
} from "./types.js";
import { isGitRepo, gitInit, removeGitDir } from "./git.js";

export interface RunOptions {
  projectName: string;
  template: Template;
  pm: PackageManager;
  targetDir: string;
  git: boolean;
  install: boolean;
  language?: Language;
  css?: CssFramework;
}

export async function scaffold(opts: RunOptions): Promise<string> {
  const { projectName, template, pm, targetDir, git, language, css } = opts;
  const projectPath = join(targetDir, projectName);

  const ctx = { projectName, pm, targetDir, language, css };
  const steps = template.steps(ctx);

  for (const step of steps) {
    const s = p.spinner();
    s.start(pc.dim(step.label));

    const cwd = step.inProject ? projectPath : targetDir;

    try {
      await execa(step.cmd, step.args, {
        cwd,
        // Interactive templates need to inherit stdio so the user can respond
        stdio: template.interactive ? "inherit" : "pipe",
      });
      s.stop(pc.green("✓") + " " + step.label);
    } catch (err) {
      s.stop(pc.red("✗") + " " + step.label);
      throw err;
    }
  }

  // ── Post-scaffold: git ────────────────────────────────────────────────────
  if (git) {
    const s = p.spinner();
    s.start(pc.dim("Initialising git repository"));
    try {
      // If scaffold already created a .git (create-next-app etc.), remove it first
      if (await isGitRepo(projectPath)) {
        await removeGitDir(projectPath);
      }
      await gitInit(projectPath);
      s.stop(pc.green("✓") + " Git initialised");
    } catch {
      s.stop(pc.yellow("⚠") + " Git init skipped (git not found)");
    }
  }

  return projectPath;
}
