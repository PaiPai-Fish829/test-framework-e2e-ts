import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

function createHtml(summary: { wdioWebExists: boolean; wdioMobileExists: boolean; vitestExists: boolean }): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Unified Test Report</title></head>
<body>
  <h1>Unified Test Report</h1>
  <ul>
    <li>WDIO Web junit exists: ${summary.wdioWebExists}</li>
    <li>WDIO Mobile junit exists: ${summary.wdioMobileExists}</li>
    <li>Vitest json exists: ${summary.vitestExists}</li>
  </ul>
  <p>WDIO Web JUnit report path: reports/wdio-web/wdio-web-junit.xml</p>
  <p>WDIO Mobile JUnit report path: reports/wdio/wdio-junit.xml</p>
  <p>Vitest report path: reports/vitest/vitest-report.json</p>
</body>
</html>`
}

async function main(): Promise<void> {
  const root = process.cwd()
  const wdioWebPath = path.join(root, 'reports', 'wdio-web', 'wdio-web-junit.xml')
  const wdioPath = path.join(root, 'reports', 'wdio', 'wdio-junit.xml')
  const vitestPath = path.join(root, 'reports', 'vitest', 'vitest-report.json')
  const summaryPath = path.join(root, 'reports', 'summary.html')

  const summary = {
    wdioWebExists: !!(await fs.stat(wdioWebPath).catch(() => undefined)),
    wdioMobileExists: !!(await fs.stat(wdioPath).catch(() => undefined)),
    vitestExists: !!(await fs.stat(vitestPath).catch(() => undefined)),
  }

  await fs.writeFile(summaryPath, createHtml(summary), 'utf8')
  console.log(`Unified report generated: ${summaryPath}`)
}

await main()
