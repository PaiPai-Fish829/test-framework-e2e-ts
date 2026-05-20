import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

async function removeIfExists(target: string): Promise<void> {
  await fs.rm(target, { force: true, recursive: true }).catch(() => undefined)
}

async function main(): Promise<void> {
  const root = process.cwd()
  await removeIfExists(path.join(root, 'reports', 'playwright'))
  await removeIfExists(path.join(root, 'reports', 'playwright-html'))
  await removeIfExists(path.join(root, 'reports', 'wdio'))
  await removeIfExists(path.join(root, 'reports', 'vitest'))
  await removeIfExists(path.join(root, 'playwright-report'))
  await removeIfExists(path.join(root, 'test-results'))
  await fs.mkdir(path.join(root, 'reports'), { recursive: true })
  await fs.writeFile(path.join(root, 'reports', '.gitkeep'), '', 'utf8')
  console.log('Clean completed')
}

await main()
