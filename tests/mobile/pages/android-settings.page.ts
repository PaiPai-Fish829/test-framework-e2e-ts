import { $, browser } from '@wdio/globals'

type MobileShellResult = {
  stdout?: string
  stderr?: string
  code?: number
}

type AndroidSystemDetails = Record<string, string>

type ScrollStrategy = {
  maxSwipes: number
  leftRatio: number
  topRatio: number
  widthRatio: number
  heightRatio: number
  percent: number
}

type RetryStrategy = {
  maxAttempts: number
}

export class AndroidSettingsPage {
  private readonly aboutPageKeywords = ['About phone', 'About device', 'About tablet', 'About', '关于手机', '关于设备', '关于']

  private readonly androidVersionKeywords = ['Android 版本', 'Android version', 'Android 版本号', 'Android version number']

  private readonly modelTitleKeywords = ['Model', 'Model name', 'Model number', '型号', '型号名称']

  private readonly kernelTitleKeywords = ['Kernel version', '内核版本']

  private readonly settingsPackageName = 'com.android.settings'

  private readonly settingsMainActivity = '.Settings'

  private readonly androidVersionDetailContainerSelector =
    '//androidx.recyclerview.widget.RecyclerView[@resource-id="com.android.settings:id/recycler_view"]'

  private readonly androidVersionDetailRowsSelector = `${this.androidVersionDetailContainerSelector}/android.widget.LinearLayout`

  private readonly baseScrollStrategy: ScrollStrategy = {
    maxSwipes: 6,
    leftRatio: 0.1,
    topRatio: 0.2,
    widthRatio: 0.8,
    heightRatio: 0.6,
    percent: 0.75,
  }

  private readonly detailCollectScrollStrategy: ScrollStrategy = {
    maxSwipes: 8,
    leftRatio: 0.1,
    topRatio: 0.2,
    widthRatio: 0.8,
    heightRatio: 0.6,
    percent: 0.75,
  }

  private readonly retryStrategy: RetryStrategy = {
    maxAttempts: 2,
  }

  /**
   * Level 1: 通用能力读取，返回 capabilities 指定键的文本值。
   */
  private getCapability(key: string): string {
    return String((browser.capabilities as Record<string, unknown>)[key] ?? '').trim()
  }

  /**
   * Level 1: 从候选 capability 键中读取首个非空文本。
   */
  private getCapabilityText(keys: string[]): string {
    for (const key of keys) {
      const value = this.getCapability(key)
      if (value.length > 0) {
        return value
      }
    }
    return ''
  }

  /**
   * Level 1: 通过 Appium `mobile: shell` 执行 adb shell 命令。
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
   * Level 1: 在设置页执行一次向下滑动。
   */
  private async swipeDown(strategy: ScrollStrategy): Promise<boolean> {
    try {
      const { width, height } = await browser.getWindowSize()
      return Boolean(
        await browser.execute('mobile: scrollGesture', {
          left: Math.floor(width * strategy.leftRatio),
          top: Math.floor(height * strategy.topRatio),
          width: Math.floor(width * strategy.widthRatio),
          height: Math.floor(height * strategy.heightRatio),
          direction: 'down',
          percent: strategy.percent,
        })
      )
    } catch {
      return false
    }
  }

  /**
   * Level 1: 强制重启设置 App，保证后续入口可控。
   */
  private async resetSettingsApp(): Promise<void> {
    const appPackage = this.getCapability('appium:appPackage') || this.settingsPackageName
    const appActivity = this.getCapability('appium:appActivity') || this.settingsMainActivity

    try {
      await browser.terminateApp(appPackage)
      await browser.pause(600)
    } catch {
      // ignore
    }

    try {
      await browser.activateApp(appPackage)
      await browser.pause(1200)
      return
    } catch {
      // ignore
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
   * Level 2: 按文本查找元素（当前屏幕，不滚动）。
   */
  private async findElementByText(keyword: string): Promise<string | null> {
    const textSelector = `//*[@text="${keyword}" or contains(@text, "${keyword}")]`
    const element = $(textSelector)
    return (await element.isExisting()) ? textSelector : null
  }

  /**
   * Level 2: 在指定容器中按文本查找行容器（当前屏幕，不滚动）。
   */
  private async findRowContainerByText(keyword: string): Promise<string | null> {
    const rowSelector = `${this.androidVersionDetailRowsSelector}[.//*[contains(@text, "${keyword}")]]/*[self::android.widget.RelativeLayout or self::android.widget.LinearLayout][1]`
    const rowContainer = $(rowSelector)
    return (await rowContainer.isExisting()) ? rowSelector : null
  }

  /**
   * Level 2: 通用滚动查找，先找后滑，直到命中或达到上限。
   */
  private async scrollUntil<T>(
    finder: () => Promise<T | null>,
    strategy: ScrollStrategy
  ): Promise<T | null> {
    for (let swipes = 0; swipes <= strategy.maxSwipes; swipes += 1) {
      const found = await finder()
      if (found) {
        return found
      }

      if (swipes === strategy.maxSwipes) {
        break
      }

      const canScrollMore = await this.swipeDown(strategy)
      if (!canScrollMore) {
        break
      }
    }

    return null
  }

  /**
   * Level 2: 根据标题文本读取其值，兼容不同 ROM 节点结构。
   */
  private async getValueByTitle(title: string): Promise<string> {
    const titleSelector = await this.findElementByText(title)
    if (!titleSelector) {
      return ''
    }
    const titleElement = $(titleSelector)

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
   * Level 2: 解析一行详情为键值对。
   */
  private async parseRow(row: WebdriverIO.Element): Promise<[string, string] | null> {
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
      return null
    }

    const key = uniqueTexts[0]
    const value = uniqueTexts.slice(1).join(' | ') || uniqueTexts[0]
    return [key, value]
  }

  /**
   * Level 2: 收集当前屏幕内的详情行。
   */
  private async collectRows(): Promise<AndroidSystemDetails> {
    const details: AndroidSystemDetails = {}
    const rows = await $$(this.androidVersionDetailRowsSelector)
    for (const row of rows) {
      const parsed = await this.parseRow(row)
      if (parsed) {
        const [key, value] = parsed
        details[key] = value
      }
    }
    return details
  }

  /**
   * Level 2: 确认 Android 版本详情容器已可见。
   */
  private async ensureDetailsContainerVisible(): Promise<void> {
    const container = $(this.androidVersionDetailContainerSelector)
    await container.waitForDisplayed({ timeout: 10000 })
  }

  /**
   * Level 2: 根据关键字集合提取标题对应的值。
   */
  private async getSummaryByTitleKeywords(titleKeywords: string[]): Promise<string> {
    for (const title of titleKeywords) {
      const value = await this.scrollUntil(
        async () => {
          const text = await this.getValueByTitle(title)
          return text.length > 0 ? text : null
        },
        this.detailCollectScrollStrategy
      )
      if (value) {
        return value
      }
    }
    return ''
  }

  /**
   * Level 3: 公共重试 + 重启模板。
   */
  private async retryWithReset<T>(name: string, action: () => Promise<T>): Promise<T> {
    let lastError: unknown = null
    for (let attempt = 1; attempt <= this.retryStrategy.maxAttempts; attempt += 1) {
      try {
        return await action()
      } catch (error) {
        lastError = error
        if (attempt === this.retryStrategy.maxAttempts) {
          break
        }
        await this.resetSettingsApp()
      }
    }

    throw new Error(`${name} failed after ${this.retryStrategy.maxAttempts} attempts: ${String(lastError)}`)
  }

  /**
   * Level 3: 实际执行“打开关于手机”动作（单次）。
   */
  private async openAboutPageOnce(): Promise<void> {
    for (const keyword of this.aboutPageKeywords) {
      const aboutEntrySelector = await this.scrollUntil(
        async () => this.findElementByText(keyword),
        this.baseScrollStrategy
      )
      if (aboutEntrySelector) {
        await $(aboutEntrySelector).click()
        return
      }
    }
    throw new Error(`cannot find About entry, tried: ${this.aboutPageKeywords.join(', ')}`)
  }

  /**
   * Level 3: 实际执行“打开 Android 版本详情”动作（单次）。
   */
  private async openAndroidVersionDetailsOnce(): Promise<void> {
    for (const keyword of this.androidVersionKeywords) {
      const rowContainerSelector = await this.scrollUntil(
        async () => this.findRowContainerByText(keyword),
        this.baseScrollStrategy
      )
      if (rowContainerSelector) {
        await $(rowContainerSelector).click()
        return
      }
    }
    throw new Error(`cannot find Android version entry, tried: ${this.androidVersionKeywords.join(', ')}`)
  }

  /**
   * Level 3: 收集 Android 版本详情（单次）。
   */
  private async collectDetailsOnce(): Promise<AndroidSystemDetails> {
    const details: AndroidSystemDetails = {}
    await this.ensureDetailsContainerVisible()

    for (let swipes = 0; swipes <= this.detailCollectScrollStrategy.maxSwipes; swipes += 1) {
      const currentRows = await this.collectRows()
      Object.assign(details, currentRows)

      if (swipes === this.detailCollectScrollStrategy.maxSwipes) {
        break
      }

      const canScrollMore = await this.swipeDown(this.detailCollectScrollStrategy)
      if (!canScrollMore) {
        break
      }
    }

    if (Object.keys(details).length === 0) {
      throw new Error('android version details are empty under LinearLayout[*]')
    }
    return details
  }

  /**
   * Level 3: 对外步骤，重启后重新进入 About 页面。
   */
  async restartSettingsApp(): Promise<void> {
    await this.resetSettingsApp()
  }

  /**
   * Level 3: 打开 About 页面（包含重试 + 重启策略）。
   */
  async openAboutPage(): Promise<void> {
    await this.retryWithReset('open about page', async () => {
      await this.openAboutPageOnce()
    })
  }

  /**
   * Level 3: 打开 Android 版本详情页面（包含重试 + 重启策略）。
   */
  async openAndroidVersionDetails(): Promise<void> {
    await this.retryWithReset('open Android version page', async () => {
      await this.openAboutPageOnce()
      await this.openAndroidVersionDetailsOnce()
    })
  }

  /**
   * Level 3: 业务聚合入口，确保进入 Android 版本详情页面。
   */
  async openAndroidVersionPage(): Promise<void> {
    await this.openAndroidVersionDetails()
  }

  /**
   * Level 3: 收集 Android 版本详情键值对（仅采集，不负责导航）。
   */
  async collectDetails(): Promise<AndroidSystemDetails> {
    return this.collectDetailsOnce()
  }

  /**
   * Level 3: 兼容旧接口名称。
   */
  async getAllAndroidSystemDetails(): Promise<AndroidSystemDetails> {
    return this.collectDetails()
  }

  /**
   * Level 4: 获取设备型号，优先 UI，其次 capabilities，最后 shell。
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
   * Level 4: 获取内核版本，优先 UI，其次 capabilities，最后 shell。
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
