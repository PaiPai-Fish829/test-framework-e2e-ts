import assert from 'node:assert/strict'
import { browser } from '@wdio/globals'

import { SauceDemoCheckoutFlow } from '../flows/saucedemo-checkout.flow.js'
import { loadYamlCases } from '../../../shared/utils/testCaseLoader.util.js'

interface CheckoutSuccessCase {
  name: string
  username: string
  password: string
  expectType: 'success'
  addItemName: string
  firstName: string
  lastName: string
  postalCode: string
  expectedUrlIncludes: string
  expectedCheckoutTitle: string
  expectedCompleteTitle: string
}

interface CheckoutErrorCase {
  name: string
  username: string
  password: string
  expectType: 'error'
  addItemName: string
  firstName: string
  lastName: string
  postalCode: string
  expectedErrorIncludes: string
}

type CheckoutCase = CheckoutSuccessCase | CheckoutErrorCase

const checkoutCases = loadYamlCases<CheckoutCase>('saucedemo-checkout.cases.yaml')

describe('SauceDemo checkout', () => {
  for (const caseData of checkoutCases) {
    it(caseData.name, async () => {
      const checkoutFlow = new SauceDemoCheckoutFlow()
      const result = await checkoutFlow.runCheckoutFlow({
        username: caseData.username,
        password: caseData.password,
        addItemName: caseData.addItemName,
        firstName: caseData.firstName,
        lastName: caseData.lastName,
        postalCode: caseData.postalCode,
      })

      if (caseData.expectType === 'error') {
        assert.equal(result.loginResult.errorVisible, true)
        assert.ok(
          result.loginResult.errorText.includes(caseData.expectedErrorIncludes),
          `expected error to include "${caseData.expectedErrorIncludes}", actual: "${result.loginResult.errorText}"`
        )
        return
      }

      assert.equal(result.loginResult.errorVisible, false)
      assert.equal(result.hasExpectedItemInCart, true)
      assert.equal(result.checkoutTitle, caseData.expectedCheckoutTitle)
      assert.equal(result.checkoutCompleteTitle, caseData.expectedCompleteTitle)
      assert.ok(
        result.currentUrl.includes(caseData.expectedUrlIncludes),
        `expected url to include ${caseData.expectedUrlIncludes}, actual: ${result.currentUrl}`
      )
    })
  }

  afterEach(async () => {
    await browser.deleteCookies()
  })
})
