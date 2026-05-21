import { $, $$ } from '@wdio/globals'

export class SauceDemoCartPage {
  private get title() {
    return $('//span[@data-test="title" and normalize-space()="Your Cart"]')
  }

  async waitForReady(): Promise<void> {
    await this.title.waitForDisplayed({ timeout: 10000 })
  }

  async getTitleText(): Promise<string> {
    return (await this.title.getText()).trim()
  }

  async getCartItemNames(): Promise<string[]> {
    const itemNameElements = await $$('.cart_item .inventory_item_name')
    const names: string[] = []

    for (const element of itemNameElements) {
      names.push((await element.getText()).trim())
    }

    return names
  }
}
