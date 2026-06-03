/**
 * @module shared/utils/app/app-config
 * @description 移动端待测 App 配置解析。优先读取 `.env`（与 `wdio.conf.ts` 一致），必要时回退 WebdriverIO session capabilities。
 */

import dotenv from 'dotenv'
import { browser } from '@wdio/globals'

dotenv.config()

export type MobilePlatform = 'android' | 'ios'

export type AndroidAppTarget = {
  platform: 'android'
  appPackage: string
  appActivity: string
}

export type IosAppTarget = {
  platform: 'ios'
  bundleId: string
}

export type MobileAppTarget = AndroidAppTarget | IosAppTarget

/**
 * 当前移动端平台，默认 `android`。
 */
export function getMobilePlatform(): MobilePlatform {
  return (process.env.MOBILE_PLATFORM ?? 'android').toLowerCase() === 'ios' ? 'ios' : 'android'
}

/**
 * 仅从 `.env` 读取 App 标识，不访问 session。
 */
export function getMobileAppTargetFromEnv(): MobileAppTarget {
  if (getMobilePlatform() === 'ios') {
    return {
      platform: 'ios',
      bundleId: process.env.IOS_BUNDLE_ID ?? 'com.apple.Preferences',
    }
  }

  return {
    platform: 'android',
    appPackage: process.env.ANDROID_APP_PACKAGE ?? 'com.android.settings',
    appActivity: process.env.ANDROID_APP_ACTIVITY ?? '.Settings',
  }
}

function getCapabilityFromSession(key: string): string {
  try {
    return String((browser.capabilities as Record<string, unknown>)[key] ?? '').trim()
  } catch {
    return ''
  }
}

/**
 * 解析待测 App：优先 `.env`；Android 在 env 无 package 时回退 capabilities。
 */
export function resolveMobileAppTarget(): MobileAppTarget {
  const fromEnv = getMobileAppTargetFromEnv()

  if (fromEnv.platform === 'ios') {
    return fromEnv
  }

  if (fromEnv.appPackage.length > 0) {
    return fromEnv
  }

  const appPackage = getCapabilityFromSession('appium:appPackage')
  const appActivity = getCapabilityFromSession('appium:appActivity')

  return {
    platform: 'android',
    appPackage: appPackage || 'com.android.settings',
    appActivity: appActivity || '.Settings',
  }
}

/**
 * 用于 `terminateApp` / `activateApp` 的应用 ID（Android 为 package，iOS 为 bundleId）。
 */
export function getMobileAppId(target: MobileAppTarget = resolveMobileAppTarget()): string {
  if (target.platform === 'ios') {
    return target.bundleId
  }
  return target.appPackage
}
