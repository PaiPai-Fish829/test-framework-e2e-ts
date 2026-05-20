import { $, browser } from '@wdio/globals'

export class SauceDemoLoginPage {
  private get usernameInput() {
    return $('[data-test="username"]')
  }

  private get passwordInput() {
    return $('[data-test="password"]')
  }

  private get loginButton() {
    return $('[data-test="login-button"]')
  }

  private get errorMessage() {
    return $('[data-test="error"]')
  }

  private get inventoryTitle() {
    return $('[data-test="title"]')
  }

  async open(): Promise<void> {
    await browser.url('https://www.saucedemo.com/')
    await this.waitForReady()
  }

  async waitForReady(): Promise<void> {
    await this.usernameInput.waitForDisplayed({ timeout: 10000 })
    await this.passwordInput.waitForDisplayed({ timeout: 10000 })
    await this.loginButton.waitForClickable({ timeout: 10000 })
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.setValue(username)
    await this.passwordInput.setValue(password)
  }

  async submit(): Promise<void> {
    await this.loginButton.click()
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password)
    await this.submit()
  }

  async waitForErrorVisible(): Promise<void> {
    await this.errorMessage.waitForDisplayed({ timeout: 10000 })
  }

  async isErrorDisplayed(timeout = 3000): Promise<boolean> {
    try {
      await this.errorMessage.waitForDisplayed({ timeout })
      return true
    } catch {
      return false
    }
  }

  async getErrorText(): Promise<string> {
    if (!(await this.errorMessage.isDisplayed())) {
      return ''
    }
    return (await this.errorMessage.getText()).trim()
  }

  async waitForInventoryLoaded(): Promise<void> {
    await this.inventoryTitle.waitForDisplayed({ timeout: 10000 })
  }

  async isInventoryTitleDisplayed(timeout = 3000): Promise<boolean> {
    try {
      await this.inventoryTitle.waitForDisplayed({ timeout })
      return true
    } catch {
      return false
    }
  }

  async getInventoryTitleText(): Promise<string> {
    return (await this.inventoryTitle.getText()).trim()
  }
}
