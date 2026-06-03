/**
 * @module shared/utils/app/app-lifecycle
 * @description 移动端 App 生命周期与用例编排。仅在 spec（Mocha 钩子 / it 步骤）中调用；Page 只封装页面内业务动作，不导入本模块。
 */

import { browser } from '@wdio/globals'

import {
  getMobileAppId,
  resolveMobileAppTarget,
  type AndroidAppTarget,
  type MobileAppTarget,
} from './app-config.util.js'

export type MobileAppLifecycleOptions = {
  /** 终止后等待毫秒数，默认 600 */
  terminatePauseMs?: number
  /** 激活/启动后等待毫秒数，默认 1200 */
  activatePauseMs?: number
}

export type MobileRetryOptions = {
  /** 失败后重试次数（含首次执行），默认 2 */
  maxAttempts?: number
} & MobileAppLifecycleOptions

const defaultLifecycleOptions: Required<MobileAppLifecycleOptions> = {
  terminatePauseMs: 600,
  activatePauseMs: 1200,
}

function resolveLifecycleOptions(
  options?: MobileAppLifecycleOptions
): Required<MobileAppLifecycleOptions> {
  return {
    terminatePauseMs: options?.terminatePauseMs ?? defaultLifecycleOptions.terminatePauseMs,
    activatePauseMs: options?.activatePauseMs ?? defaultLifecycleOptions.activatePauseMs,
  }
}

/**
 * 关闭当前配置的 App（依赖 `.env` 或 `resolveMobileAppTarget()`）。
 */
export async function terminateMobileApp(
  target: MobileAppTarget = resolveMobileAppTarget(),
  options?: MobileAppLifecycleOptions
): Promise<void> {
  const { terminatePauseMs } = resolveLifecycleOptions(options)
  const appId = getMobileAppId(target)

  try {
    await browser.terminateApp(appId)
    await browser.pause(terminatePauseMs)
  } catch {
    // ignore：App 可能已不在前台
  }
}

/**
 * 先关闭再打开 App，适用于 `describe` 级 `before` 钩子，保证用例从干净前台开始。
 */
export async function restartMobileApp(
  target: MobileAppTarget = resolveMobileAppTarget(),
  options?: MobileAppLifecycleOptions
): Promise<void> {
  const lifecycle = resolveLifecycleOptions(options)

  await terminateMobileApp(target, { terminatePauseMs: lifecycle.terminatePauseMs })

  if (target.platform === 'ios') {
    try {
      await browser.activateApp(target.bundleId)
      await browser.pause(lifecycle.activatePauseMs)
      return
    } catch {
      // ignore
    }
    return
  }

  await activateAndroidApp(target, lifecycle.activatePauseMs)
}

async function activateAndroidApp(target: AndroidAppTarget, activatePauseMs: number): Promise<void> {
  try {
    await browser.activateApp(target.appPackage)
    await browser.pause(activatePauseMs)
    return
  } catch {
    // ignore
  }

  await browser.execute('mobile: startActivity', {
    appPackage: target.appPackage,
    appActivity: target.appActivity,
    appWaitPackage: target.appPackage,
    appWaitActivity: target.appActivity,
  })
  await browser.pause(activatePauseMs)
}

/**
 * 执行动作；失败时在下次重试前自动 `restartMobileApp`，用于 spec 中对 Page 导航步骤的重试编排。
 */
export async function retryWithMobileAppRestart<T>(
  name: string,
  action: () => Promise<T>,
  options?: MobileRetryOptions
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 2
  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await action()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts) {
        break
      }
      await restartMobileApp(resolveMobileAppTarget(), options)
    }
  }

  throw new Error(`${name} failed after ${maxAttempts} attempts: ${String(lastError)}`)
}

/**
 * 清除 App 数据（登录态、缓存），便于下一条用例从未登录状态开始。
 */
export async function clearMobileAppData(
  target: MobileAppTarget = resolveMobileAppTarget()
): Promise<void> {
  const appId = getMobileAppId(target)

  try {
    if (target.platform === 'android') {
      await browser.execute('mobile: clearApp', { appId })
    }
  } catch {
    if (target.platform === 'android') {
      await browser.execute('mobile: shell', {
        command: 'pm',
        args: ['clear', target.appPackage],
      })
    }
  }
}

/**
 * 用例级回收：关闭 App → 清数据 → 再启动。参数化每条用例前后调用，避免停在登录页影响下一条。
 */
export async function resetMobileAppForNextCase(
  target: MobileAppTarget = resolveMobileAppTarget(),
  options?: MobileAppLifecycleOptions
): Promise<void> {
  const lifecycle = resolveLifecycleOptions(options)

  await terminateMobileApp(target, { terminatePauseMs: lifecycle.terminatePauseMs })
  await clearMobileAppData(target)

  if (target.platform === 'ios') {
    try {
      await browser.activateApp(target.bundleId)
      await browser.pause(lifecycle.activatePauseMs)
    } catch {
      // ignore
    }
    return
  }

  await activateAndroidApp(target, lifecycle.activatePauseMs)
}
