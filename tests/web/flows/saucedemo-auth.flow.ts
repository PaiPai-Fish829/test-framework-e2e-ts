import { browser } from '@wdio/globals'

import { SauceDemoLoginPage } from '../pages/saucedemo-login.page.js'

export interface LoginFlowResult {
  currentUrl: string
  inventoryTitle: string
  errorVisible: boolean
  errorText: string
}

export class SauceDemoAuthFlow {
  constructor(private readonly loginPage = new SauceDemoLoginPage()) {}

  private async openLoginPage(): Promise<void> {
    await this.loginPage.open()
  }

  async runLoginFlow(username: string, password: string): Promise<LoginFlowResult> {
    await this.openLoginPage()
    await this.loginPage.login(username, password)

    const currentUrl = await browser.getUrl()
    const inventoryVisible = await this.loginPage.isInventoryTitleDisplayed()

    if (inventoryVisible) {
      return {
        currentUrl,
        inventoryTitle: await this.loginPage.getInventoryTitleText(),
        errorVisible: false,
        errorText: '',
      }
    }

    const errorVisible = await this.loginPage.isErrorDisplayed()
    return {
      currentUrl,
      inventoryTitle: '',
      errorVisible,
      errorText: errorVisible ? await this.loginPage.getErrorText() : '',
    }
  }
}
