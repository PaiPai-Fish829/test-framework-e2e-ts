import dotenv from 'dotenv'

dotenv.config()

export const config = {
  runner: 'local',
  specs: ['./tests/web/specs/**/*.spec.ts'],
  maxInstances: 1,
  logLevel: 'info',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 1,
  framework: 'mocha',
  reporters: [
    'spec',
    ['junit', { outputDir: './reports/wdio-web', outputFileFormat: () => 'wdio-web-junit.xml' }],
  ],
  capabilities: [
    {
      browserName: process.env.WEB_BROWSER ?? 'chrome',
    },
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
}
