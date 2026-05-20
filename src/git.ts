import { execa } from 'execa'
import { rm } from 'fs/promises'
import { join } from 'path'

export async function removeGitDir(dir: string): Promise<void> {
  await rm(join(dir, '.git'), { recursive: true, force: true })
}

export async function gitInit(cwd: string): Promise<void> {
  await execa('git', ['init'], { cwd })
  await execa('git', ['add', '-A'], { cwd })
  await execa('git', ['commit', '-m', 'chore: initial commit'], { cwd })
}

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await execa('git', ['-C', dir, 'rev-parse', '--git-dir'])
    return true
  } catch {
    return false
  }
}
