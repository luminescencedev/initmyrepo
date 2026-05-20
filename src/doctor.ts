import { execa } from "execa";
import pc from "picocolors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getVersion(cmd: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execa(cmd, args);
    return stdout.trim().replace(/^v/, "");
  } catch {
    return null;
  }
}

function parseVersion(v: string): [number, number, number] {
  const parts = v.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function gte(v: string, min: string): boolean {
  const [ma, mi, pa] = parseVersion(v);
  const [mb, mib, pb] = parseVersion(min);
  if (ma !== mb) return ma > mb;
  if (mi !== mib) return mi > mib;
  return pa >= pb;
}

function row(ok: boolean, label: string, detail: string): void {
  const icon = ok ? pc.green("✔") : pc.red("✘");
  const name = ok ? pc.bold(label) : pc.dim(label);
  console.log(`  ${icon}  ${name}  ${pc.dim(detail)}`);
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export async function runDoctor(): Promise<void> {
  const MIN_NODE = "22.13.0";

  console.log(pc.bold("\n  Checking prerequisites…\n"));

  // ── Node.js ─────────────────────────────────────────────────────────────────
  const nodeVer = await getVersion("node", ["--version"]);
  if (nodeVer) {
    const ok = gte(nodeVer, MIN_NODE);
    row(
      ok,
      "Node.js",
      ok ? `v${nodeVer}` : `v${nodeVer}  (requires >= ${MIN_NODE})`,
    );
  } else {
    row(false, "Node.js", "not found");
  }

  // ── Git ──────────────────────────────────────────────────────────────────────
  const gitVer = await getVersion("git", ["--version"]);
  if (gitVer) {
    // "git version 2.x.y" → strip the "git version " prefix
    const clean = gitVer.replace(/^git version\s*/i, "");
    row(true, "git", `v${clean}`);
  } else {
    row(false, "git", "not found — required for git init after scaffold");
  }

  // ── Package managers ─────────────────────────────────────────────────────────
  console.log();
  console.log(pc.bold("  Package managers\n"));

  const pms: Array<{ name: string; cmd: string; note?: string }> = [
    { name: "npm", cmd: "npm" },
    { name: "pnpm", cmd: "pnpm" },
    { name: "yarn", cmd: "yarn" },
    { name: "bun", cmd: "bun", note: "required for Elysia template" },
  ];

  let allPmOk = true;
  for (const pm of pms) {
    const ver = await getVersion(pm.cmd, ["--version"]);
    const found = ver !== null;
    if (!found) allPmOk = false;
    const detail = found
      ? `v${ver}${pm.note ? pc.dim(`  · ${pm.note}`) : ""}`
      : `not found${pm.note ? pc.yellow(`  · ${pm.note}`) : ""}`;
    row(found, pm.name, detail);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log();
  const nodeOk = nodeVer !== null && gte(nodeVer, MIN_NODE);
  const gitOk = gitVer !== null;
  const npmOk = (await getVersion("npm", ["--version"])) !== null;

  if (nodeOk && gitOk && npmOk) {
    console.log(
      pc.green("  ✔ ") +
        pc.bold("All core prerequisites are satisfied.") +
        "\n",
    );
  } else {
    console.log(
      pc.yellow("  ⚠ ") +
        pc.bold("Some prerequisites are missing or outdated.") +
        "\n",
    );
  }
}
