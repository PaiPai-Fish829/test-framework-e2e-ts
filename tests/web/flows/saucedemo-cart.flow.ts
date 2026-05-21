import { browser } from '@wdio/globals'

import { SauceDemoCartPage } from '../pages/saucedemo-cart.page.js'

export interface CartFlowResult {
  currentUrl: string
  cartTitle: string
  cartItemNames: string[]
  hasExpectedItem: boolean
}

export class SauceDemoCartFlow {
  constructor(private readonly cartPage = new SauceDemoCartPage()) {}

  async runCartFlow(expectedItemName: string): Promise<CartFlowResult> {
    await this.cartPage.waitForReady()

    const cartItemNames = await this.cartPage.getCartItemNames()

    return {
      currentUrl: await browser.getUrl(),
      cartTitle: await this.cartPage.getTitleText(),
      cartItemNames,
      hasExpectedItem: cartItemNames.includes(expectedItemName),
    }
  }
}
