import assert from 'node:assert/strict'

import { AndroidSettingsPage } from '../pages/android-settings.page.js'

describe('Android设备信息详情', () => {
  it('读取Android版本页面中的所有设备系统详情', async () => {
    const settingsPage = new AndroidSettingsPage()

    await settingsPage.restartSettingsApp()
    await settingsPage.openAndroidVersionPage()

    const details = await settingsPage.collectDetails()
    const detailEntries = Object.entries(details)

    assert.ok(detailEntries.length > 0, '设备系统详情应该不为空')

    for (const [key, value] of detailEntries) {
      console.log(`[设备系统详情] ${key}: ${value}`)
    }
  })
})
