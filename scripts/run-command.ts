import { spawn } from 'node:child_process'
import process from 'node:process'

export async function runCommand(args: string[]): Promise<void> {
  const command = 'corepack'

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, ['pnpm', ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true,
    })
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Command failed: corepack pnpm ${args.join(' ')}, code=${code}`))
    })
  })
}
