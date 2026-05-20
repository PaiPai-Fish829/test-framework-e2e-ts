import assert from 'node:assert/strict'

import { browser } from '@wdio/globals'

import { DevicePage } from '../pages/device.page.js'

describe('Mobile smoke', () => {
  it('starts a valid Appium session on Android or iOS', async () => {
    const devicePage = new DevicePage()
    const platform = await devicePage.getPlatformName()
    const sessionId = await devicePage.getSessionId()

    assert.ok(['android', 'ios'].includes(platform), `unexpected platform: ${platform}`)
    assert.ok(sessionId.length > 0, 'session id should not be empty')

    await browser.pause(500)
  })
})
