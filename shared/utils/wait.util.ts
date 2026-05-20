export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

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
