import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/tests/**/*.spec.ts'],
    environment: 'node',
    reporters: ['default', 'json'],
    outputFile: {
      json: 'reports/vitest/vitest-report.json',
    },
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: 'reports/vitest/coverage',
    },
  },
})
