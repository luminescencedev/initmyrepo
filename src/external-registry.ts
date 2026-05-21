import { readFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { existsSync } from "fs";
import type { Template, Category, ScaffoldContext } from "./types.js";

// ─── Schema ────────────────────────────────────────────────────────────────────

export interface ExternalTemplateDef {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  category?: Category;
  badge?: string;
  docs?: string;
}

// ─── Validation ────────────────────────────────────────────────────────────────

/** Allow only https://, http://, and git@host:path — blocks ext::, file://, etc. */
export function isSafeGitUrl(url: string): boolean {
  return /^https?:\/\/.+/.test(url) || /^git@[^:]+:.+/.test(url);
}

function isValidDef(def: unknown): def is ExternalTemplateDef {
  if (!def || typeof def !== "object") return false;
  const d = def as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    d.id.length > 0 &&
    typeof d.name === "string" &&
    d.name.length > 0 &&
    typeof d.description === "string" &&
    typeof d.repoUrl === "string" &&
    isSafeGitUrl(d.repoUrl)
  );
}

interface RcFile {
  /** Inline custom templates */
  templates?: ExternalTemplateDef[];
  /** URLs pointing to remote JSON registries (array of ExternalTemplateDef[]) */
  registries?: string[];
}

// ─── Conversion ────────────────────────────────────────────────────────────────

export function externalToTemplate(def: ExternalTemplateDef): Template {
  if (!isSafeGitUrl(def.repoUrl)) {
    throw new Error(
      `External template "${def.id}" has an unsafe repoUrl: "${def.repoUrl}"`,
    );
  }
  return {
    id: `ext:${def.id}`,
    name: def.name,
    description: def.description,
    category: def.category ?? "web",
    badge: def.badge,
    docs: def.docs ?? def.repoUrl,
    steps: ({ projectName }: ScaffoldContext) => [
      {
        label: `Cloning ${def.name}`,
        cmd: "git",
        args: ["clone", "--depth=1", def.repoUrl, projectName],
      },
    ],
  };
}

// ─── Loader ────────────────────────────────────────────────────────────────────

/**
 * Load external templates from:
 *  1. `.initmyreporc.json` in the current working directory (project-local)
 *  2. `.initmyreporc.json` in the user's home directory (global)
 *
 * Each rc file can also declare `registries` — remote URLs that return a
 * JSON array of ExternalTemplateDef objects.
 */
export async function loadExternalTemplates(): Promise<Template[]> {
  const defs: ExternalTemplateDef[] = [];

  const locations = [
    join(process.cwd(), ".initmyreporc.json"),
    join(homedir(), ".initmyreporc.json"),
  ];

  for (const loc of locations) {
    if (!existsSync(loc)) continue;
    try {
      const raw = await readFile(loc, "utf8");
      const rc = JSON.parse(raw) as RcFile;

      if (Array.isArray(rc.templates)) {
        defs.push(...rc.templates);
      }

      for (const url of rc.registries ?? []) {
        if (typeof url !== "string" || !url.startsWith("https://")) {
          console.warn(`[initmyrepo] Skipping registry — only HTTPS URLs are allowed: "${url}"`);
          continue;
        }
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = (await res.json()) as unknown[];
            if (Array.isArray(data)) {
              const valid = data.filter(isValidDef);
              defs.push(...valid);
            }
          }
        } catch {
          /* network error — skip silently */
        }
      }

      break; // first file wins
    } catch {
      /* parse error — skip */
    }
  }

  return defs.map(externalToTemplate);
}
