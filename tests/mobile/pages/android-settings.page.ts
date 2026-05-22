import { $, browser } from '@wdio/globals'

type MobileShellResult = {
  stdout?: string
  stderr?: string
  code?: number
}

type AndroidSystemDetails = Record<string, string>

export class AndroidSettingsPage {
  private readonly aboutPageKeywords = ['About phone', 'About device', 'About tablet', 'About', '关于手机', '关于设备', '关于']

  private readonly modelTitleKeywords = ['Model', 'Model name', 'Model number', '型号', '型号名称']

  private readonly kernelTitleKeywords = ['Kernel version', '内核版本']

  private readonly settingsPackageName = 'com.android.settings'

  private readonly settingsMainActivity = '.Settings'

  private readonly androidVersionDetailContainerSelector =
    '//androidx.recyclerview.widget.RecyclerView[@resource-id="com.android.settings:id/recycler_view"]'

  private readonly androidVersionDetailRowsSelector = `${this.androidVersionDetailContainerSelector}/android.widget.LinearLayout`

  /**
   * 在当前可滚动区域内查找包含指定文本的元素，并可选点击该元素。
   */
  private async scrollToText(keyword: string, click = false): Promise<boolean> {
    const maxSwipes = 6
    const textSelector = `//*[@text="${keyword}" or contains(@text, "${keyword}")]`

    for (let swipes = 0; swipes <= maxSwipes; swipes += 1) {
      const item = $(textSelector)
      if (await item.isExisting()) {
        if (click) {
          await item.click()
        }
        return true
      }

      if (swipes === maxSwipes) {
        break
      }

      const canScrollMore = await this.swipeDownInSettings()
      if (!canScrollMore) {
        break
      }
    }

    return false
  }

  /**
   * 从 capabilities 中读取设置 App 的包名，未配置时回退默认值。
   */
  private getSettingsAppPackage(): string {
    return String(
      (browser.capabilities as Record<string, unknown>)['appium:appPackage'] ??
        this.settingsPackageName
    ).trim()
  }

  /**
   * 从 capabilities 中读取设置 App 的主 activity，未配置时回退默认值。
   */
  private getSettingsAppActivity(): string {
    return String(
      (browser.capabilities as Record<string, unknown>)['appium:appActivity'] ??
        this.settingsMainActivity
    ).trim()
  }

  /**
   * 强制重启设置 App，保证每次从可控入口开始。
   */
  async restartSettingsApp(): Promise<void> {
    const appPackage = this.getSettingsAppPackage() || this.settingsPackageName
    const appActivity = this.getSettingsAppActivity() || this.settingsMainActivity

    try {
      await browser.terminateApp(appPackage)
      await browser.pause(600)
    } catch {
      // App 不在前台或终止失败时继续走激活逻辑。
    }

    try {
      await browser.activateApp(appPackage)
      await browser.pause(1200)
      return
    } catch {
      // 某些设备上 activateApp 不稳定，回退到 startActivity。
    }

    await browser.execute('mobile: startActivity', {
      appPackage,
      appActivity,
      appWaitPackage: appPackage,
      appWaitActivity: appActivity,
    })
    await browser.pause(1200)
  }

  /**
   * 打开系统设置中的 About 页面，按多语言关键字依次尝试。
   */
  async openAboutPage(): Promise<void> {
    for (const keyword of this.aboutPageKeywords) {
      if (await this.scrollToText(keyword, true)) {
        return
      }
    }

    await this.restartSettingsApp()
    for (const keyword of this.aboutPageKeywords) {
      if (await this.scrollToText(keyword, true)) {
        return
      }
    }

    throw new Error(`cannot find About entry, tried: ${this.aboutPageKeywords.join(', ')}`)
  }

  /**
   * 打开“Android 版本”详情页（或弹窗），用于读取系统详细信息。
   */
  async openAndroidVersionDetails(): Promise<void> {
    const androidVersionKeywords = ['Android 版本', 'Android version', 'Android 版本号', 'Android version number']

    for (const keyword of androidVersionKeywords) {
      const rowContainer = $(
        `//androidx.recyclerview.widget.RecyclerView[@resource-id="com.android.settings:id/recycler_view"]/android.widget.LinearLayout[.//*[contains(@text, "${keyword}")]]/*[self::android.widget.RelativeLayout or self::android.widget.LinearLayout][1]`
      )
      if (await rowContainer.isExisting()) {
        await rowContainer.click()
        return
      }
    }

    for (const keyword of androidVersionKeywords) {
      if (await this.scrollToText(keyword, true)) {
        return
      }
    }

    throw new Error(`cannot find Android version entry, tried: ${androidVersionKeywords.join(', ')}`)
  }

  /**
   * 根据标题文本定位值字段，兼容不同 ROM 的节点层级与 resource-id 差异。
   */
  private async getValueByTitle(title: string): Promise<string> {
    const titleElement = await $(`//*[@text="${title}" or contains(@text, "${title}")]`)
    if (!(await titleElement.isExisting())) {
      return ''
    }

    const candidateSelectors = [
      './following-sibling::android.widget.TextView[normalize-space(@text)!=""][1]',
      './../android.widget.TextView[normalize-space(@text)!="" and not(@text="' + title + '")][1]',
      './../*[(contains(@resource-id, "summary") or contains(@resource-id, "value")) and normalize-space(@text)!=""][1]',
      './following::android.widget.TextView[normalize-space(@text)!="" and not(@text="' + title + '")][1]',
    ]

    for (const selector of candidateSelectors) {
      const valueElement = await titleElement.$(selector)
      if (await valueElement.isExisting()) {
        const text = (await valueElement.getText()).trim()
        if (text.length > 0) {
          return text
        }
      }
    }

    return ''
  }

  /**
   * 在设置页执行一次向下滑动，并返回是否还能继续滚动。
   */
  private async swipeDownInSettings(): Promise<boolean> {
    try {
      const { width, height } = await browser.getWindowSize()
      return Boolean(
        await browser.execute('mobile: scrollGesture', {
          left: Math.floor(width * 0.1),
          top: Math.floor(height * 0.2),
          width: Math.floor(width * 0.8),
          height: Math.floor(height * 0.6),
          direction: 'down',
          percent: 0.75,
        })
      )
    } catch {
      return false
    }
  }

  /**
   * 按标题关键字查找对应的值，必要时有限次下滑后继续查找。
   */
  private async getSummaryByTitleKeywords(titleKeywords: string[]): Promise<string> {
    const maxSwipes = 8

    for (let swipes = 0; swipes <= maxSwipes; swipes += 1) {
      for (const title of titleKeywords) {
        const value = await this.getValueByTitle(title)
        if (value.length > 0) {
          return value
        }
      }

      if (swipes === maxSwipes) {
        break
      }

      const canScrollMore = await this.swipeDownInSettings()
      if (!canScrollMore) {
        break
      }
    }

    return ''
  }

  /**
   * 通过 Appium `mobile: shell` 执行 adb shell 命令，返回标准输出文本。
   */
  private async runAndroidShell(command: string, args: string[]): Promise<string> {
    try {
      const result = (await browser.execute('mobile: shell', { command, args })) as string | MobileShellResult
      if (typeof result === 'string') {
        return result.trim()
      }
      return String(result?.stdout ?? '').trim()
    } catch {
      return ''
    }
  }

  /**
   * 从 capabilities 的候选键中读取首个非空文本值。
   */
  private getCapabilityText(keys: string[]): string {
    for (const key of keys) {
      const value = String((browser.capabilities as Record<string, unknown>)[key] ?? '').trim()
      if (value.length > 0) {
        return value
      }
    }
    return ''
  }

  /**
   * 读取 Android 版本详情容器中的全部行，并组装为键值对。
   */
  async getAllAndroidSystemDetails(): Promise<AndroidSystemDetails> {
    const detailMap: AndroidSystemDetails = {}
    const container = $(this.androidVersionDetailContainerSelector)
    await container.waitForDisplayed({ timeout: 10000 })

    const maxSwipes = 8
    for (let swipes = 0; swipes <= maxSwipes; swipes += 1) {
      const rows = await $$(this.androidVersionDetailRowsSelector)

      for (const row of rows) {
        const textViews = await row.$$('.//android.widget.TextView')
        const texts: string[] = []

        for (const textView of textViews) {
          const raw = (await textView.getText()).trim()
          if (raw.length > 0) {
            texts.push(raw)
          }
        }

        const uniqueTexts = [...new Set(texts)]
        if (uniqueTexts.length === 0) {
          continue
        }

        const key = uniqueTexts[0]
        const value = uniqueTexts.slice(1).join(' | ') || uniqueTexts[0]
        detailMap[key] = value
      }

      if (swipes === maxSwipes) {
        break
      }

      const canScrollMore = await this.swipeDownInSettings()
      if (!canScrollMore) {
        break
      }
    }

    if (Object.keys(detailMap).length === 0) {
      throw new Error('android version details are empty under LinearLayout[*]')
    }

    return detailMap
  }

  /**
   * 获取设备型号：优先读取设置页，其次 capabilities，最后回退到 shell 命令。
   */
  async getDeviceModel(): Promise<string> {
    const fromSettings = await this.getSummaryByTitleKeywords(this.modelTitleKeywords)
    if (fromSettings.length > 0) {
      return fromSettings
    }

    const fromCapabilities = this.getCapabilityText(['appium:deviceModel', 'appium:deviceName', 'deviceName'])
    if (fromCapabilities.length > 0) {
      return fromCapabilities
    }

    return this.runAndroidShell('getprop', ['ro.product.model'])
  }

  /**
   * 获取内核版本：优先读取设置页，其次 capabilities，最后回退到 shell 命令。
   */
  async getKernelVersion(): Promise<string> {
    const fromSettings = await this.getSummaryByTitleKeywords(this.kernelTitleKeywords)
    if (fromSettings.length > 0) {
      return fromSettings
    }

    const fromCapabilities = this.getCapabilityText(['platformVersion', 'appium:platformVersion'])
    if (fromCapabilities.length > 0) {
      return fromCapabilities
    }

    return this.runAndroidShell('uname', ['-r'])
  }
}
