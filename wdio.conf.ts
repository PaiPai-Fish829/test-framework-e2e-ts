import dotenv from 'dotenv'

dotenv.config()

const mobilePlatform = (process.env.MOBILE_PLATFORM ?? 'android').toLowerCase()
const appiumPort = Number(process.env.APPIUM_PORT ?? 4723)
const appiumHost = process.env.APPIUM_HOST ?? '127.0.0.1'

const androidCaps = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE_NAME ?? 'Android Emulator',
  'appium:appPackage': process.env.ANDROID_APP_PACKAGE ?? 'com.android.settings',
  'appium:appActivity': process.env.ANDROID_APP_ACTIVITY ?? '.Settings',
  'appium:noReset': true,
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
        command: 'appium',
        args: {
          address: appiumHost,
          port: appiumPort,
        },
      },
    ],
  ],
  hostname: appiumHost,
  port: appiumPort,
  path: '/',
  capabilities: [mobilePlatform === 'ios' ? iosCaps : androidCaps],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
}
