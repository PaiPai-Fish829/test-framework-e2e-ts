import { $, browser } from '@wdio/globals'

export class TplinkApp {
  private readonly agreeButton = 'id=com.tplink.ipc:id/dialog_select_confirm_tv'
  private readonly iknowButton = 'id=com.tplink.ipc:id/dialog_select_confirm_tv'
  private readonly enterButton = 'id=com.tplink.ipc:id/app_guide_btn'
  private readonly skipUpdateButton = 'id=com.tplink.ipc:id/dialog_select_cancel_tv'

  private readonly myselfTab = 'id=com.tplink.ipc:id/main_activity_tab_mine_iv'
  private readonly checkBox = 'id=com.tplink.ipc:id/local_device_item_click_guide'
  private readonly loginButton = 'id=com.tplink.ipc:id/mine_menu_login_tv'
  private readonly usernameInput = 'id=com.tplink.ipc:id/account_auto_complete_tv'
  private readonly passwordInput = 'id=com.tplink.ipc:id/common_edit_text_commonedit'
  private readonly loginConfirmButton = 'id=com.tplink.ipc:id/account_login_login_tv'

  private async appearAndClick(selector: string, timeout = 10000): Promise<void> {
    const el = $(selector)
    await el.waitForDisplayed({ timeout, interval: 400 })
    await el.click()
  }

  private async appearAndClickIfShown(selector: string, timeout = 4000): Promise<void> {
    try {
      await this.appearAndClick(selector, timeout)
    } catch {
      // 未出现则跳过
    }
  }

  async appOpen(): Promise<void> {
    await this.appearAndClickIfShown(this.agreeButton)
    await this.appearAndClickIfShown(this.iknowButton)
    await this.appearAndClickIfShown(this.enterButton)
    await this.appearAndClickIfShown(this.skipUpdateButton)
    await $(this.myselfTab).waitForDisplayed({ timeout: 20000, interval: 400 })
  }

  /**
   * 是否仍在登录页：账号、密码输入框均可见视为未登录成功。
   */
  async isStillOnLoginForm(): Promise<boolean> {
    const usernameVisible = await $(this.usernameInput).isDisplayed().catch(() => false)
    const passwordVisible = await $(this.passwordInput).isDisplayed().catch(() => false)
    return usernameVisible && passwordVisible
  }

  /**
   * 等待登录结果与 expectLogin 一致。
   * expectLogin=true：输入框消失；false：输入框仍可见。
   */
  async waitForLoginOutcome(expectLogin: boolean, timeout = 15000): Promise<void> {
    const expectOnForm = !expectLogin
    await browser.waitUntil(async () => (await this.isStillOnLoginForm()) === expectOnForm, {
      timeout,
      interval: 400,
      timeoutMsg: expectLogin
        ? '登录成功预期：账号/密码输入框应消失'
        : '登录失败预期：账号/密码输入框应仍可见',
    })
  }

  async leaveLoginPage(): Promise<void> {
    try {
      await browser.pressKeyCode(4)
      await browser.pause(500)
    } catch {
      // ignore
    }
  }

  async login(username: string, password: string, submit = true): Promise<void> {
    await this.appearAndClick(this.myselfTab, 10000)
    await this.appearAndClickIfShown(this.checkBox, 4000)
    await this.appearAndClick(this.loginButton, 10000)

    const usernameEl = $(this.usernameInput)
    await usernameEl.waitForDisplayed({ timeout: 10000, interval: 400 })
    await usernameEl.setValue(username)

    const passwordEl = $(this.passwordInput)
    await passwordEl.waitForDisplayed({ timeout: 10000, interval: 400 })
    await passwordEl.setValue(password)

    if (submit) {
      await this.appearAndClick(this.loginConfirmButton, 10000)
    }
  }
}
