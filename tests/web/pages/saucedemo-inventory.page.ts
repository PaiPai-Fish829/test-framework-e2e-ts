import { $, $$, browser } from '@wdio/globals'

export class SauceDemoInventoryPage {
  private get title() {
    return $('[data-test="title"]')
  }

  private get sortSelect() {
    return $('[data-test="product-sort-container"]')
  }

  private get cartBadge() {
    return $('[data-test="shopping-cart-badge"]')
  }

  private get shoppingCartLink() {
    return $('[data-test="shopping-cart-link"]')
  }

  private get shoppingCartTitle() {
    return $('//span[@data-test="title" and normalize-space()="Your Cart"]')
  }

  async waitForReady(): Promise<void> {
    await this.title.waitForDisplayed({ timeout: 10000 })
  }

  async getTitleText(): Promise<string> {
    return (await this.title.getText()).trim()
  }

  async getInventoryItemCount(): Promise<number> {
    const items = await $$('.inventory_item')
    return items.length
  }

  async getFirstItemName(): Promise<string> {
    const firstName = await $('.inventory_item_name')
    if (!(await firstName.isDisplayed())) {
      return ''
    }
    return (await firstName.getText()).trim()
  }

  async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortSelect.selectByAttribute('value', value)
  }

  async addItemToCartByName(itemName: string): Promise<void> {
    const button = await $(
      `//div[contains(@class,"inventory_item")][.//div[contains(@class,"inventory_item_name") and normalize-space()="${itemName}"]]//button`
    )
    await button.waitForClickable({ timeout: 10000 })
    await button.click()
  }

  async getCartBadgeText(): Promise<string> {
    if (!(await this.cartBadge.isDisplayed())) {
      return ''
    }
    return (await this.cartBadge.getText()).trim()
  }

  async clickShoppingCartLink(): Promise<void> {
    await this.shoppingCartLink.waitForClickable({ timeout: 10000 })
    await this.shoppingCartLink.click()
  }

  async waitForShoppingCartPage(): Promise<void> {
    await browser.waitUntil(async () => this.isOnShoppingCartPage(), {
      timeout: 10000,
      timeoutMsg: '等待跳转到购物车页面超时',
    })
  }

  async isOnShoppingCartPage(): Promise<boolean> {
    const currentUrl = await browser.getUrl()
    const titleDisplayed = await this.shoppingCartTitle.isDisplayed()
    return currentUrl.includes('/cart.html') && titleDisplayed
  }
}
