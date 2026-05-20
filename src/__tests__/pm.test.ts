import { describe, it, expect, vi, beforeEach } from "vitest";
import { readdir } from "fs/promises";
import { installStep, addDevStep, dlx, create, detectPM } from "../pm.js";

// Mock fs/promises at module level (Vitest hoists this)
vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
}));

// ─── installStep ──────────────────────────────────────────────────────────────

describe("installStep", () => {
  it.each(["npm", "pnpm", "yarn", "bun"] as const)(
    "builds a step for %s",
    (pm) => {
      const step = installStep(pm);
      expect(step.label).toBe("Installing dependencies");
      expect(step.cmd).toBe(pm);
      expect(step.args).toEqual(["install"]);
      expect(step.inProject).toBe(true);
      expect(step.type).toBe("install");
    },
  );
});

// ─── addDevStep ───────────────────────────────────────────────────────────────

describe("addDevStep", () => {
  it("uses npm install --save-dev for npm", () => {
    const step = addDevStep("npm", "tailwindcss", "@tailwindcss/vite");
    expect(step.cmd).toBe("npm");
    expect(step.args).toEqual([
      "install",
      "--save-dev",
      "tailwindcss",
      "@tailwindcss/vite",
    ]);
    expect(step.type).toBe("install");
  });

  it.each(["pnpm", "yarn", "bun"] as const)("uses add -D for %s", (pm) => {
    const step = addDevStep(pm, "tailwindcss");
    expect(step.args).toEqual(["add", "-D", "tailwindcss"]);
    expect(step.type).toBe("install");
  });

  it("includes all deps in label", () => {
    const step = addDevStep("pnpm", "a", "b", "c");
    expect(step.label).toBe("Adding a, b, c");
  });
});

// ─── dlx ─────────────────────────────────────────────────────────────────────

describe("dlx", () => {
  it("uses pnpm dlx for pnpm", () => {
    const { cmd, args } = dlx("pnpm", "create-vite@latest", "my-app");
    expect(cmd).toBe("pnpm");
    expect(args).toEqual(["dlx", "create-vite@latest", "my-app"]);
  });

  it("uses yarn dlx for yarn", () => {
    const { cmd, args } = dlx("yarn", "create-vite@latest", "my-app");
    expect(cmd).toBe("yarn");
    expect(args).toEqual(["dlx", "create-vite@latest", "my-app"]);
  });

  it("uses bunx for bun", () => {
    const { cmd, args } = dlx("bun", "create-vite@latest", "my-app");
    expect(cmd).toBe("bunx");
    expect(args).toEqual(["create-vite@latest", "my-app"]);
  });

  it("uses npx for npm", () => {
    const { cmd, args } = dlx("npm", "create-vite@latest", "my-app");
    expect(cmd).toBe("npx");
    expect(args).toEqual(["create-vite@latest", "my-app"]);
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe("create", () => {
  it("uses pnpm create for pnpm", () => {
    const { cmd, args } = create("pnpm", "vite@latest", "my-app");
    expect(cmd).toBe("pnpm");
    expect(args).toEqual(["create", "vite@latest", "my-app"]);
  });

  it("strips @latest from package name for yarn", () => {
    const { cmd, args } = create("yarn", "vite@latest", "my-app");
    expect(cmd).toBe("yarn");
    expect(args[1]).toBe("vite");
  });

  it("uses bun create for bun", () => {
    const { cmd, args } = create("bun", "vite@latest", "my-app");
    expect(cmd).toBe("bun");
    expect(args).toEqual(["create", "vite@latest", "my-app"]);
  });

  it("inserts -- before extra args for npm", () => {
    const { cmd, args } = create(
      "npm",
      "vite@latest",
      "my-app",
      "--template",
      "react",
    );
    expect(cmd).toBe("npm");
    expect(args).toEqual([
      "create",
      "vite@latest",
      "--",
      "my-app",
      "--template",
      "react",
    ]);
  });

  it("does not insert -- when npm has no extra args", () => {
    const { cmd, args } = create("npm", "vite@latest");
    expect(args).toEqual(["create", "vite@latest"]);
  });
});

// ─── detectPM ────────────────────────────────────────────────────────────────

describe("detectPM", () => {
  beforeEach(() => {
    vi.mocked(readdir).mockReset();
  });

  it("detects pnpm from pnpm-lock.yaml", async () => {
    vi.mocked(readdir).mockResolvedValue([
      "pnpm-lock.yaml",
      "package.json",
    ] as any);
    expect(await detectPM()).toBe("pnpm");
  });

  it("detects yarn from yarn.lock", async () => {
    vi.mocked(readdir).mockResolvedValue(["yarn.lock", "package.json"] as any);
    expect(await detectPM()).toBe("yarn");
  });

  it("detects npm from package-lock.json", async () => {
    vi.mocked(readdir).mockResolvedValue(["package-lock.json"] as any);
    expect(await detectPM()).toBe("npm");
  });

  it("detects bun from bun.lockb", async () => {
    vi.mocked(readdir).mockResolvedValue(["bun.lockb"] as any);
    expect(await detectPM()).toBe("bun");
  });

  it("detects bun from bun.lock", async () => {
    vi.mocked(readdir).mockResolvedValue(["bun.lock"] as any);
    expect(await detectPM()).toBe("bun");
  });

  it("returns undefined when no lockfile found", async () => {
    vi.mocked(readdir).mockResolvedValue(["src", "README.md"] as any);
    expect(await detectPM()).toBeUndefined();
  });

  it("returns undefined when readdir throws", async () => {
    vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
    expect(await detectPM()).toBeUndefined();
  });

  it("bun takes priority over pnpm", async () => {
    vi.mocked(readdir).mockResolvedValue([
      "bun.lockb",
      "pnpm-lock.yaml",
    ] as any);
    expect(await detectPM()).toBe("bun");
  });
});
