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

interface RcFile {
  /** Inline custom templates */
  templates?: ExternalTemplateDef[];
  /** URLs pointing to remote JSON registries (array of ExternalTemplateDef[]) */
  registries?: string[];
}

// ─── Conversion ────────────────────────────────────────────────────────────────

export function externalToTemplate(def: ExternalTemplateDef): Template {
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
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = (await res.json()) as ExternalTemplateDef[];
            if (Array.isArray(data)) defs.push(...data);
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
