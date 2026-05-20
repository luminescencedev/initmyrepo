import type { Template } from '../types.js'
import { create, dlx, installStep } from '../pm.js'

export const BACKEND_TEMPLATES: Template[] = [
  {
    id: 'hono',
    category: 'backend',
    name: 'Hono',
    description: 'Ultra-fast web framework · TypeScript · Node.js / Edge ready',
    badge: 'TS',
    docs: 'https://hono.dev',
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating Hono project',
        ...create(pm, 'hono@latest', projectName, '--template', 'nodejs'),
      },
      installStep(pm),
    ],
  },

  {
    id: 'fastify',
    category: 'backend',
    name: 'Fastify',
    description: 'High-performance Node.js framework · TypeScript · JSON Schema validation',
    badge: 'TS',
    docs: 'https://fastify.dev',
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating Fastify project',
        ...create(pm, 'fastify@latest', projectName),
      },
      installStep(pm),
    ],
  },

  {
    id: 'nestjs',
    category: 'backend',
    name: 'NestJS',
    description: 'Enterprise Node.js framework · TypeScript · Modular architecture',
    badge: 'TS',
    docs: 'https://nestjs.com',
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating NestJS project',
        ...dlx(pm, '@nestjs/cli@latest', 'new', projectName,
          '--package-manager', pm,
          '--language', 'TypeScript',
          '--strict',
          '--skip-git',
        ),
      },
    ],
  },

  {
    id: 'express-api',
    category: 'backend',
    name: 'Express API',
    description: 'Minimal REST API · TypeScript · No view engine',
    badge: 'TS',
    docs: 'https://expressjs.com',
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating Express project',
        ...dlx(pm, 'express-generator', '--no-view', projectName),
      },
      installStep(pm),
    ],
  },

  {
    id: 'elysia',
    category: 'backend',
    name: 'Elysia',
    description: 'Bun-first web framework · TypeScript · End-to-end type safety',
    badge: 'Bun',
    docs: 'https://elysiajs.com',
    steps: ({ projectName }) => [
      {
        label: 'Creating Elysia project',
        cmd: 'bun',
        args: ['create', 'elysia', projectName],
      },
    ],
  },

  {
    id: 'trpc-server',
    category: 'backend',
    name: 'tRPC + Fastify',
    description: 'End-to-end type-safe API · TypeScript · Fastify adapter',
    badge: 'TS',
    docs: 'https://trpc.io',
    steps: ({ projectName, pm }) => [
      {
        label: 'Cloning tRPC Fastify starter',
        cmd: 'git',
        args: ['clone', '--depth=1', 'https://github.com/trpc/trpc', `${projectName}/.trpc-tmp`],
      },
      installStep(pm),
    ],
  },
]
