/**
 * @module shared/utils/wait
 * @description 公用异步等待工具。不依赖 WebdriverIO / Playwright，可用于 API、单元测试或脚本中的轮询等待。
 */

/**
 * 固定时长休眠（毫秒）。
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * 轮询直到 `checker` 返回 true 或超时。
 * @param checker - 同步或异步条件函数
 * @param timeoutMs - 超时毫秒数，默认 5000
 * @param intervalMs - 轮询间隔，默认 200
 * @throws 超时仍未满足条件时抛出 Error
 */
export async function waitForCondition(
  checker: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 200,
): Promise<void> {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await checker()) {
      return
    }
    await sleep(intervalMs)
  }
  throw new Error(`Condition not met within ${timeoutMs}ms`)
}
