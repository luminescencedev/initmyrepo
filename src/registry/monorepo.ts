import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { Template, Step } from '../types.js'
import { dlx, installStep } from '../pm.js'

// ─── pnpm manual workspace helper ────────────────────────────────────────────

function pnpmWorkspaceSteps(projectName: string): Step[] {
  return [
    {
      label: 'Generating workspace structure',
      cmd: 'node',
      args: [
        '--eval',
        `
const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), '${projectName}');
fs.mkdirSync(path.join(root, 'apps/web'), { recursive: true });
fs.mkdirSync(path.join(root, 'apps/api'), { recursive: true });
fs.mkdirSync(path.join(root, 'packages/ui'), { recursive: true });
fs.mkdirSync(path.join(root, 'packages/config'), { recursive: true });

fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'),
  'packages:\\n  - apps/*\\n  - packages/*\\n');

fs.writeFileSync(path.join(root, 'package.json'),
  JSON.stringify({ name: '${projectName}', private: true, scripts: { dev: 'pnpm -r dev', build: 'pnpm -r build', lint: 'pnpm -r lint' } }, null, 2));

fs.writeFileSync(path.join(root, 'apps/web/package.json'),
  JSON.stringify({ name: '@${projectName}/web', version: '0.0.0', private: true }, null, 2));

fs.writeFileSync(path.join(root, 'apps/api/package.json'),
  JSON.stringify({ name: '@${projectName}/api', version: '0.0.0', private: true }, null, 2));

fs.writeFileSync(path.join(root, 'packages/ui/package.json'),
  JSON.stringify({ name: '@${projectName}/ui', version: '0.0.0', main: './src/index.ts', exports: { '.': './src/index.ts' } }, null, 2));

fs.writeFileSync(path.join(root, 'packages/config/package.json'),
  JSON.stringify({ name: '@${projectName}/config', version: '0.0.0' }, null, 2));

fs.writeFileSync(path.join(root, '.gitignore'),
  'node_modules/\\n.turbo/\\ndist/\\n.env\\n.env.local\\n');

fs.writeFileSync(path.join(root, 'README.md'),
  '# ${projectName}\\n\\nMonorepo workspace.\\n\\n## Structure\\n\\n\`\`\`\\n${projectName}/\\n├── apps/\\n│   ├── web/\\n│   └── api/\\n└── packages/\\n    ├── ui/\\n    └── config/\\n\`\`\`\\n');

console.log('Workspace structure created.');
        `.trim(),
      ],
    },
  ]
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const MONOREPO_TEMPLATES: Template[] = [
  {
    id: 'turborepo',
    category: 'monorepo',
    name: 'Turborepo',
    description: 'High-performance build system · Next.js + API apps · TypeScript',
    badge: 'Vercel',
    docs: 'https://turbo.build',
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating Turborepo workspace (interactive)',
        ...dlx(pm, 'create-turbo@latest', projectName, '--package-manager', pm),
      },
    ],
  },

  {
    id: 'nx',
    category: 'monorepo',
    name: 'Nx Workspace',
    description: 'Monorepo build system · Plugins for React, Next, Node, Angular',
    badge: 'Nrwl',
    docs: 'https://nx.dev',
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: 'Creating Nx workspace (interactive)',
        ...dlx(pm, 'create-nx-workspace@latest', projectName, '--pm', pm),
      },
    ],
  },

  {
    id: 'pnpm-workspace',
    category: 'monorepo',
    name: 'pnpm Workspace',
    description: 'Custom pnpm workspace · apps/ + packages/ · Ready to extend',
    badge: 'Custom',
    docs: 'https://pnpm.io/workspaces',
    steps: ({ projectName }) => pnpmWorkspaceSteps(projectName),
  },
]
