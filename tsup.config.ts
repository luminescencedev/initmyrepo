import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node18",
  clean: true,
  splitting: false,
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import { createRequire as __cjsRequire } from 'module';",
      "const require = __cjsRequire(import.meta.url);",
    ].join("\n"),
  },
  treeshake: true,
  noExternal: [/.*/],
});
