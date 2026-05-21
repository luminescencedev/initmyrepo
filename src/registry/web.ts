import type { Template, ScaffoldContext, Step } from "../types.js";
import { create, dlx, installStep, addDevStep } from "../pm.js";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function tailwindSteps(pm: ScaffoldContext["pm"]): Step[] {
  return [installStep(pm), addDevStep(pm, "tailwindcss", "@tailwindcss/vite")];
}

function viteTemplate(
  id: string,
  name: string,
  description: string,
  /** Base template name without -ts suffix (e.g. "react", "vue") */
  baseTemplate: string,
  docs: string,
): Template {
  return {
    id,
    category: "web",
    name,
    description,
    badge: undefined,
    docs,
    ask: { language: true, css: true },
    steps: ({ projectName, pm, language, css }) => {
      const template = language === "js" ? baseTemplate : `${baseTemplate}-ts`;
      return [
        {
          label: `Creating ${name}`,
          ...create(pm, "vite@latest", projectName, "--template", template),
        },
        ...(css === "tailwind" ? tailwindSteps(pm) : [installStep(pm)]),
      ];
    },
  };
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const WEB_TEMPLATES: Template[] = [
  viteTemplate(
    "react-vite",
    "React + Vite",
    "React 19 · Vite 6",
    "react",
    "https://vitejs.dev",
  ),

  viteTemplate(
    "vue-vite",
    "Vue 3 + Vite",
    "Vue 3.5 Composition API · Vite 6",
    "vue",
    "https://vuejs.org",
  ),

  viteTemplate(
    "svelte-vite",
    "Svelte 5 + Vite",
    "Svelte 5 Runes · Vite 6",
    "svelte",
    "https://svelte.dev",
  ),

  viteTemplate(
    "solid-vite",
    "SolidJS + Vite",
    "SolidJS 1.9 · Vite 6",
    "solid",
    "https://solidjs.com",
  ),

  {
    id: "next",
    category: "web",
    name: "Next.js 15",
    description: "App Router · TypeScript · ESLint",
    badge: "App Router",
    docs: "https://nextjs.org",
    ask: { css: true },
    steps: ({ projectName, pm, css }) => [
      {
        label: "Creating Next.js project",
        ...dlx(
          pm,
          "create-next-app@latest",
          projectName,
          "--typescript",
          "--eslint",
          "--app",
          "--no-src-dir",
          "--import-alias",
          "@/*",
          "--no-git",
          css === "tailwind" ? "--tailwind" : "--no-tailwind",
        ),
      },
      installStep(pm),
    ],
  },

  {
    id: "astro",
    category: "web",
    name: "Astro",
    description: "Content-first framework · TypeScript · Minimal template",
    badge: "SSG/SSR",
    docs: "https://astro.build",
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Astro project (interactive)",
        ...create(pm, "astro@latest", projectName),
      },
    ],
  },

  {
    id: "sveltekit",
    category: "web",
    name: "SvelteKit",
    description: "Full-stack Svelte · TypeScript · File-based routing",
    badge: "SSR",
    docs: "https://kit.svelte.dev",
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: "Creating SvelteKit project (interactive)",
        ...dlx(pm, "sv@latest", "create", projectName),
      },
    ],
  },

  {
    id: "nuxt",
    category: "web",
    name: "Nuxt 3",
    description: "Fullstack Vue framework · TypeScript · Auto-imports",
    badge: "SSR",
    docs: "https://nuxt.com",
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Nuxt project",
        ...dlx(pm, "nuxi@latest", "init", projectName),
      },
      installStep(pm),
    ],
  },

  {
    id: "remix",
    category: "web",
    name: "Remix",
    description: "Full-stack web framework · TypeScript · Vite · Nested routes",
    badge: "Vite",
    docs: "https://remix.run",
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Remix project (interactive)",
        ...create(pm, "remix@latest", projectName),
      },
    ],
  },

  {
    id: "tanstack-start",
    category: "web",
    name: "TanStack Start",
    description:
      "Full-stack React · TypeScript · File-based routing · tRPC ready",
    badge: "NEW",
    docs: "https://tanstack.com/start",
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: "Creating TanStack Start project (interactive)",
        ...create(pm, "tsrouter-app@latest", projectName),
      },
    ],
  },
];
