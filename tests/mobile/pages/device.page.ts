import { browser } from '@wdio/globals'

export class DevicePage {
  async getPlatformName(): Promise<string> {
    return String(browser.capabilities.platformName ?? '').toLowerCase()
  }

  async getSessionId(): Promise<string> {
    return browser.sessionId
  }
}
