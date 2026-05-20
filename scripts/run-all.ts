import { runCommand } from './run-command.js'

await runCommand(['run', 'test:unit'])
await runCommand(['run', 'test:e2e'])
