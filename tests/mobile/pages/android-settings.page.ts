import { $ } from '@wdio/globals'

import {
  scrollAndCollectListRows,
  scrollUntil,
  type ListCollectConfig,
  type ListRowTexts,
} from '../../../shared/utils/app/app-ui.util.js'

/**
 * 系统「设置」App 中 Android 版本详情相关页面封装。
 */
export class AndroidSettingsPage {
  private readonly aboutKeywords = ['About phone', 'About device', 'About tablet', 'About', '关于手机', '关于设备', '关于']

  private readonly androidVersionKeywords = ['Android 版本', 'Android version', 'Android 版本号', 'Android version number']

  private readonly versionListSelector =
    '//androidx.recyclerview.widget.RecyclerView[@resource-id="com.android.settings:id/recycler_view"]'

  /** 每一栏容器；`$$` 得到多行，行内 title/summary 由采集工具按同级子节点自动解析 */
  private readonly versionRowSelector =
    `${this.versionListSelector}/android.widget.LinearLayout/android.widget.RelativeLayout`

  private readonly versionListCollectConfig: ListCollectConfig = {
    rowSelector: this.versionRowSelector,
  }

  private async findByText(keyword: string): Promise<string | null> {
    const selector = `//*[@text="${keyword}" or contains(@text, "${keyword}")]`
    return (await $(selector).isExisting()) ? selector : null
  }

  private async findVersionRowByText(keyword: string): Promise<string | null> {
    const selector = `${this.versionRowSelector}[.//*[contains(@text, "${keyword}")]]`
    return (await $(selector).isExisting()) ? selector : null
  }

  private async scrollToAndClick(keywords: string[], finder: (kw: string) => Promise<string | null>): Promise<void> {
    for (const keyword of keywords) {
      const selector = await scrollUntil(() => finder(keyword), { preset: 'normal' })
      if (selector) {
        await $(selector).click()
        return
      }
    }
    throw new Error(`未找到可点击项，已尝试: ${keywords.join(', ')}`)
  }

  private async openAboutPage(): Promise<void> {
    await this.scrollToAndClick(this.aboutKeywords, (kw) => this.findByText(kw))
  }

  private async openAndroidVersionEntry(): Promise<void> {
    await this.scrollToAndClick(this.androidVersionKeywords, (kw) => this.findVersionRowByText(kw))
  }

  async openAndroidVersionPage(): Promise<void> {
    await this.openAboutPage()
    await this.openAndroidVersionEntry()
  }

  /**
   * 采集版本详情列表。仅配置行 XPath；每行返回 `string | string[]` 混合列表。
   */
  async collectDetails(): Promise<ListRowTexts[]> {
    await $(this.versionListSelector).waitForDisplayed({ timeout: 10000 })

    const rows = await scrollAndCollectListRows(this.versionListCollectConfig, {
      preset: 'normal',
      maxSwipes: 8,
    })

    if (rows.length === 0) {
      throw new Error('Android 版本详情列表为空')
    }
    return rows
  }
}
