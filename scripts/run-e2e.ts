import { runCommand } from './run-command.js'

await runCommand(['run', 'test:web'])
await runCommand(['run', 'test:mobile'])
