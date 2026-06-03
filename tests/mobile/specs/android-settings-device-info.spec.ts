import assert from 'node:assert/strict'

import {
  restartMobileApp,
  retryWithMobileAppRestart,
  terminateMobileApp,
} from '../../../shared/utils/app/app-lifecycle.util.js'
import { formatListRow } from '../../../shared/utils/app/app-ui.util.js'
import { AndroidSettingsPage } from '../pages/android-settings.page.js'

describe('Android设备信息详情', () => {
  before(async () => {
    await restartMobileApp()
  })

  after(async () => {
    await terminateMobileApp()
  })

  it('读取Android版本页面中的所有设备系统详情', async () => {
    const settingsPage = new AndroidSettingsPage()

    await retryWithMobileAppRestart('打开 Android 版本详情页', async () => {
      await settingsPage.openAndroidVersionPage()
    })

    const rows = await settingsPage.collectDetails()

    assert.ok(rows.length > 0, '设备系统详情应该不为空')

    for (const row of rows) {
      console.log(`[设备系统详情] ${formatListRow(row)}`)
    }
  })
})
