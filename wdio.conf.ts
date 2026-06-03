import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

dotenv.config()

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const appiumBinary = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'appium.CMD' : 'appium'
)

const mobilePlatform = (process.env.MOBILE_PLATFORM ?? 'android').toLowerCase()
const appiumPort = Number(process.env.APPIUM_PORT ?? 5100)
const appiumHost = process.env.APPIUM_HOST ?? '127.0.0.1'
const androidAdbPort = process.env.ANDROID_ADB_PORT

/**
 * 规范化 appActivity，避免 `.com.xxx.Activity` 这种误写（会被解析成包名+相对路径错误）。
 * - `.MainActivity` → 保持（相对包名的简写）
 * - `com.pkg.MainActivity` → 保持（完整类名）
 */
function normalizeAppActivity(appPackage: string, appActivity: string): string {
  const activity = appActivity.trim()
  if (activity.startsWith(`.${appPackage}.`)) {
    return activity.slice(1)
  }
  return activity
}

/** 解析 .env 布尔值：未设置时用 defaultValue */
function envBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase()
  if (raw === undefined || raw === '') return defaultValue
  return raw === 'true' || raw === '1' || raw === 'yes'
}

/**
 * Session 启动时是否保留 App 数据（登录态、缓存等）。
 * - true（默认）：不清理，适合设置页等不依赖「首次安装」状态的用例
 * - false：每次新建 Session 前清理 App 数据，适合 TP-Link 登录等需未登录态的用例
 * ANDROID_FULL_RESET=true 时会卸载重装，比 noReset=false 更彻底（更慢）
 */
const androidNoReset = envBool('ANDROID_NO_RESET', true)
const androidFullReset = envBool('ANDROID_FULL_RESET', false)

const androidCaps = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE_NAME ?? 'Android Emulator',
  ...(androidAdbPort ? { 'appium:udid': `127.0.0.1:${androidAdbPort}` } : {}),
  'appium:systemPort': Number(process.env.ANDROID_SYSTEM_PORT ?? 8500),
  'appium:appPackage': process.env.ANDROID_APP_PACKAGE ?? 'com.android.settings',
  'appium:appActivity': normalizeAppActivity(
    process.env.ANDROID_APP_PACKAGE ?? 'com.android.settings',
    process.env.ANDROID_APP_ACTIVITY ?? '.Settings'
  ),
  'appium:noReset': androidFullReset ? false : androidNoReset,
  ...(androidFullReset ? { 'appium:fullReset': true } : {}),
}

const iosCaps = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': process.env.IOS_DEVICE_NAME ?? 'iPhone 15',
  'appium:platformVersion': process.env.IOS_PLATFORM_VERSION ?? '17.5',
  'appium:bundleId': process.env.IOS_BUNDLE_ID ?? 'com.apple.Preferences',
  'appium:noReset': true,
}

export const config = {
  runner: 'local',
  specs: ['./tests/mobile/specs/**/*.spec.ts'],
  maxInstances: 1,
  logLevel: 'info',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 1,
  framework: 'mocha',
  reporters: [
    'spec',
    ['junit', { outputDir: './reports/wdio', outputFileFormat: () => 'wdio-junit.xml' }],
  ],
  services: [
    [
      'appium',
      {
        command: appiumBinary,
        args: {
          address: appiumHost,
          port: appiumPort,
          allowInsecure: '*:adb_shell',
        },
        appiumStartTimeout: 60000,
      },
    ],
  ],
  hostname: appiumHost,
  port: appiumPort,
  path: '/',
  capabilities: [mobilePlatform === 'ios' ? iosCaps : androidCaps],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
}
