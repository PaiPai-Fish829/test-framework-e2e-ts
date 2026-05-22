import assert from 'node:assert/strict'

import { AndroidSettingsPage } from '../pages/android-settings.page.js'

describe('Android settings device info', () => {
  it('reads all android system details from android version page', async () => {
    const settingsPage = new AndroidSettingsPage()

    await settingsPage.restartSettingsApp()
    await settingsPage.openAboutPage()
    await settingsPage.openAndroidVersionDetails()

    const details = await settingsPage.getAllAndroidSystemDetails()
    const detailEntries = Object.entries(details)

    assert.ok(detailEntries.length > 0, 'android system details should not be empty')

    for (const [key, value] of detailEntries) {
      console.log(`[mobile-system-detail] ${key}: ${value}`)
    }
  })
})
