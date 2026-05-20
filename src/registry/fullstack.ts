import type { Template } from '../types.js'
import { create, installStep } from '../pm.js'

export const FULLSTACK_TEMPLATES: Template[] = [
  {
    id: 't3',
    category: 'fullstack',
    name: 'T3 Stack',
    description: 'Next.js · tRPC · Prisma · NextAuth · TailwindCSS',
    badge: 'Opinionated',
    docs: 'https://create.t3.gg',
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating T3 project (interactive)',
        ...create(pm, 't3-app@latest', projectName),
      },
    ],
  },

  {
    id: 'better-t-stack',
    category: 'fullstack',
    name: 'Better T Stack',
    description: 'Hono/Elysia + React · tRPC/oRPC · Drizzle · Better Auth · Turborepo',
    badge: 'NEW',
    docs: 'https://better-t-stack.dev',
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating Better T Stack (interactive)',
        ...create(pm, 'better-t-stack@latest', projectName),
      },
    ],
  },

  {
    id: 'next-payload',
    category: 'fullstack',
    name: 'Next.js + Payload CMS',
    description: 'App Router · TypeScript · Payload 3 · PostgreSQL',
    badge: 'CMS',
    docs: 'https://payloadcms.com',
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating Payload project (interactive)',
        ...create(pm, 'payload@latest', projectName),
      },
    ],
  },
]
