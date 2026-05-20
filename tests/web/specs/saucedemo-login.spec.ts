import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { browser } from '@wdio/globals'
import yaml from 'js-yaml'

import { SauceDemoAuthFlow } from '../flows/saucedemo-auth.flow.js'

interface LoginSuccessCase {
  name: string
  username: string
  password: string
  expectType: 'success'
  expectedTitle: string
  expectedUrlIncludes: string
}

interface LoginErrorCase {
  name: string
  username: string
  password: string
  expectType: 'error'
  expectedErrorIncludes: string
}

type LoginCase = LoginSuccessCase | LoginErrorCase

function loadCases(): LoginCase[] {
  const currentFile = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFile)
  const caseFile = path.resolve(currentDir, '../../../shared/fixtures/saucedemo-login.cases.yaml')
  const raw = readFileSync(caseFile, 'utf8')
  const parsed = yaml.load(raw) as { cases?: LoginCase[] }

  if (!Array.isArray(parsed?.cases) || parsed.cases.length === 0) {
    throw new Error('saucedemo-login.cases.yaml must contain a non-empty "cases" array')
  }

  return parsed.cases
}

const loginCases = loadCases()

describe('SauceDemo auth', () => {
  for (const caseData of loginCases) {
    it(caseData.name, async () => {
      const authFlow = new SauceDemoAuthFlow()
      const result = await authFlow.runLoginFlow(caseData.username, caseData.password)

      if (caseData.expectType === 'success') {
        assert.ok(
          result.currentUrl.includes(caseData.expectedUrlIncludes),
          `expected url to include ${caseData.expectedUrlIncludes}, actual: ${result.currentUrl}`
        )
        assert.equal(result.inventoryTitle, caseData.expectedTitle)
        assert.equal(result.errorVisible, false)
        return
      }

      assert.equal(result.errorVisible, true)
      assert.ok(
        result.errorText.includes(caseData.expectedErrorIncludes),
        `expected error to include "${caseData.expectedErrorIncludes}", actual: "${result.errorText}"`
      )
    })
  }

  afterEach(async () => {
    await browser.deleteCookies()
  })
})
