import assert from 'node:assert/strict'
import { browser } from '@wdio/globals'

import { SauceDemoAuthFlow } from '../flows/saucedemo-auth.flow.js'
import { loadYamlCases } from '../../../shared/utils/testCaseLoader.util.js'

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

const loginCases = loadYamlCases<LoginCase>('saucedemo-login.cases.yaml')

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
