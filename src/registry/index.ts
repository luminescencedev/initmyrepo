import type { Category, Template } from '../types.js'
import { WEB_TEMPLATES }       from './web.js'
import { MOBILE_TEMPLATES }    from './mobile.js'
import { BACKEND_TEMPLATES }   from './backend.js'
import { FULLSTACK_TEMPLATES } from './fullstack.js'
import { MONOREPO_TEMPLATES }  from './monorepo.js'

export const ALL_TEMPLATES: Template[] = [
  ...WEB_TEMPLATES,
  ...MOBILE_TEMPLATES,
  ...BACKEND_TEMPLATES,
  ...FULLSTACK_TEMPLATES,
  ...MONOREPO_TEMPLATES,
]

export const TEMPLATES_BY_CATEGORY = new Map<Category, Template[]>([
  ['web',       WEB_TEMPLATES],
  ['mobile',    MOBILE_TEMPLATES],
  ['backend',   BACKEND_TEMPLATES],
  ['fullstack', FULLSTACK_TEMPLATES],
  ['monorepo',  MONOREPO_TEMPLATES],
])

export function findTemplate(id: string): Template | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id)
}
