import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { execa } from "execa";
import type { Template } from "../types.js";
import { create, dlx, installStep } from "../pm.js";

export const BACKEND_TEMPLATES: Template[] = [
  {
    id: "hono",
    category: "backend",
    name: "Hono",
    description: "Ultra-fast web framework · TypeScript · Node.js / Edge ready",
    badge: "TS",
    docs: "https://hono.dev",
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Hono project",
        ...create(pm, "hono@latest", projectName, "--template", "nodejs"),
      },
      installStep(pm),
    ],
  },

  {
    id: "fastify",
    category: "backend",
    name: "Fastify",
    description:
      "High-performance Node.js framework · TypeScript · JSON Schema validation",
    badge: "TS",
    docs: "https://fastify.dev",
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Fastify project",
        ...create(pm, "fastify@latest", projectName),
      },
      installStep(pm),
    ],
  },

  {
    id: "nestjs",
    category: "backend",
    name: "NestJS",
    description:
      "Enterprise Node.js framework · TypeScript · Modular architecture",
    badge: "TS",
    docs: "https://nestjs.com",
    steps: ({ projectName, pm }) => [
      {
        label: "Creating NestJS project",
        ...dlx(
          pm,
          "@nestjs/cli@latest",
          "new",
          projectName,
          "--package-manager",
          pm,
          "--language",
          "TypeScript",
          "--strict",
          "--skip-git",
        ),
      },
    ],
  },

  {
    id: "express-api",
    category: "backend",
    name: "Express API",
    description: "Minimal REST API · TypeScript · No view engine",
    badge: "TS",
    docs: "https://expressjs.com",
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Express project",
        ...dlx(pm, "express-generator", "--no-view", projectName),
      },
      installStep(pm),
    ],
  },

  {
    id: "elysia",
    category: "backend",
    name: "Elysia",
    description:
      "Bun-first web framework · TypeScript · End-to-end type safety",
    badge: "Bun",
    docs: "https://elysiajs.com",
    warning:
      'Elysia is Bun-first. This template always runs "bun create elysia" — make sure bun is installed (https://bun.sh).',
    steps: ({ projectName }) => [
      {
        label: "Creating Elysia project",
        fn: async ({ projectPath: _p }) => {
          try {
            await execa("bun", ["--version"], { stdio: "pipe" });
          } catch {
            throw new Error(
              "bun is not installed or not in PATH.\n  Install it from https://bun.sh then retry.",
            );
          }
          await execa("bun", ["create", "elysia", projectName], {
            cwd: join(_p, ".."),
            stdio: "inherit",
          });
        },
      },
    ],
  },

  {
    id: "hono-bun",
    category: "backend",
    name: "Hono + Bun",
    description: "Ultra-fast Hono · Bun runtime · TypeScript",
    badge: "Bun",
    docs: "https://hono.dev",
    warning:
      'This template requires Bun. Install it from https://bun.sh',
    steps: ({ projectName }) => [
      {
        label: "Creating Hono + Bun project",
        fn: async ({ projectPath }) => {
          try {
            await execa("bun", ["--version"], { stdio: "pipe" });
          } catch {
            throw new Error(
              "bun is not installed or not in PATH.\n  Install it from https://bun.sh then retry.",
            );
          }
          await execa("bun", ["create", "hono", projectName, "--template", "bun"], {
            cwd: join(projectPath, ".."),
            stdio: "inherit",
          });
        },
      },
    ],
  },

  {
    id: "cloudflare-worker",
    category: "backend",
    name: "Cloudflare Worker",
    description: "Edge-first serverless · TypeScript · Wrangler · Hono compatible",
    badge: "Edge",
    docs: "https://developers.cloudflare.com/workers",
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Cloudflare Worker (interactive)",
        ...create(pm, "cloudflare@latest", projectName),
      },
    ],
  },

  {
    id: "trpc-server",
    category: "backend",
    name: "tRPC + Fastify",
    description: "End-to-end type-safe API · TypeScript · Fastify adapter",
    badge: "TS",
    docs: "https://trpc.io",
    steps: ({ projectName, pm }) => [
      {
        label: "Scaffolding tRPC + Fastify project",
        fn: async ({ projectPath }) => {
          await mkdir(join(projectPath, "src"), { recursive: true });

          await writeFile(
            join(projectPath, "package.json"),
            JSON.stringify(
              {
                name: projectName,
                version: "0.0.1",
                private: true,
                type: "module",
                scripts: {
                  dev: "tsx watch src/index.ts",
                  build: "tsc",
                  start: "node dist/index.js",
                },
                dependencies: {
                  "@trpc/server": "^11.0.0",
                  fastify: "^5.0.0",
                  zod: "^3.23.0",
                },
                devDependencies: {
                  "@types/node": "^22.0.0",
                  tsx: "^4.0.0",
                  typescript: "^5.6.0",
                },
              },
              null,
              2,
            ),
          );

          await writeFile(
            join(projectPath, "tsconfig.json"),
            JSON.stringify(
              {
                compilerOptions: {
                  target: "ES2022",
                  module: "ESNext",
                  moduleResolution: "bundler",
                  strict: true,
                  outDir: "dist",
                  rootDir: "src",
                  esModuleInterop: true,
                  skipLibCheck: true,
                },
                include: ["src"],
              },
              null,
              2,
            ),
          );

          await writeFile(
            join(projectPath, ".gitignore"),
            "node_modules/\ndist/\n.env\n",
          );

          await writeFile(
            join(projectPath, "src/router.ts"),
            [
              "import { initTRPC } from '@trpc/server'",
              "import { z } from 'zod'",
              "",
              "const t = initTRPC.create()",
              "",
              "export const appRouter = t.router({",
              "  hello: t.procedure",
              "    .input(z.object({ name: z.string().optional() }))",
              "    .query(({ input }) => {",
              "      return { message: `Hello ${input.name ?? 'World'}` }",
              "    }),",
              "})",
              "",
              "export type AppRouter = typeof appRouter",
              "",
            ].join("\n"),
          );

          await writeFile(
            join(projectPath, "src/index.ts"),
            [
              "import Fastify from 'fastify'",
              "import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify'",
              "import { appRouter, type AppRouter } from './router.js'",
              "",
              "const app = Fastify({ logger: true })",
              "",
              "app.register(fastifyTRPCPlugin, {",
              "  prefix: '/trpc',",
              '  trpcOptions: { router: appRouter } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],',
              "})",
              "",
              "app.listen({ port: 3000 }, () => {",
              "  console.log('Server running on http://localhost:3000')",
              "})",
              "",
            ].join("\n"),
          );
        },
      },
      installStep(pm),
    ],
  },
];
