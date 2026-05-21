import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { browser } from '@wdio/globals'
import yaml from 'js-yaml'

import { SauceDemoInventoryFlow } from '../flows/saucedemo-inventory.flow.js'

interface InventorySuccessCase {
  name: string
  username: string
  password: string
  expectType: 'success'
  expectedUrlIncludes: string
  expectedTitle: string
  expectedItemCountMin: number
  sortValue?: 'az' | 'za' | 'lohi' | 'hilo'
  addItemName?: string
  expectedCartBadge?: string
}

interface InventoryErrorCase {
  name: string
  username: string
  password: string
  expectType: 'error'
  expectedErrorIncludes: string
}

type InventoryCase = InventorySuccessCase | InventoryErrorCase

function loadCases(): InventoryCase[] {
  const currentFile = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFile)
  const caseFile = path.resolve(currentDir, '../../../shared/fixtures/saucedemo-inventory.cases.yaml')
  const raw = readFileSync(caseFile, 'utf8')
  const parsed = yaml.load(raw) as { cases?: InventoryCase[] }

  if (!Array.isArray(parsed?.cases) || parsed.cases.length === 0) {
    throw new Error('saucedemo-inventory.cases.yaml must contain a non-empty "cases" array')
  }

  return parsed.cases
}

const inventoryCases = loadCases()

describe('SauceDemo inventory', () => {
  for (const caseData of inventoryCases) {
    it(caseData.name, async () => {
      const inventoryFlow = new SauceDemoInventoryFlow()
      const result = await inventoryFlow.runInventoryFlow({
        username: caseData.username,
        password: caseData.password,
        sortValue: caseData.expectType === 'success' ? caseData.sortValue : undefined,
        addItemName: caseData.expectType === 'success' ? caseData.addItemName : undefined,
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
      assert.ok(
        result.loginResult.currentUrl.includes(caseData.expectedUrlIncludes),
        `expected url to include ${caseData.expectedUrlIncludes}, actual: ${result.loginResult.currentUrl}`
      )
      assert.equal(result.inventoryTitle, caseData.expectedTitle)
      assert.ok(
        result.inventoryItemCount >= caseData.expectedItemCountMin,
        `expected item count >= ${caseData.expectedItemCountMin}, actual: ${result.inventoryItemCount}`
      )

      if (caseData.expectedCartBadge) {
        assert.equal(result.cartBadgeText, caseData.expectedCartBadge)
      }

      if (caseData.addItemName) {
        assert.ok(result.cartFlowResult, 'expected cart flow result to be available')
        assert.equal(result.cartFlowResult?.hasExpectedItem, true)
        assert.ok(
          result.cartFlowResult?.currentUrl.includes('/cart.html'),
          `expected cart url to include /cart.html, actual: ${result.cartFlowResult?.currentUrl}`
        )
        assert.equal(result.cartFlowResult?.cartTitle, 'Your Cart')
        assert.ok(
          result.cartFlowResult?.cartItemNames.includes(caseData.addItemName),
          `expected cart items to include "${caseData.addItemName}", actual: ${result.cartFlowResult?.cartItemNames.join(', ')}`
        )
      }
    })
  }

  afterEach(async () => {
    await browser.deleteCookies()
  })
})
