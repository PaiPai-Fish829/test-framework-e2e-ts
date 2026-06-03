/**
 * @module shared/utils/testCaseLoader
 * @description 公用 YAML 用例加载器。从 `shared/fixtures` 读取带 `cases` 数组的 YAML，供 Web / Mobile spec 做数据驱动参数化。
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

interface ParsedCases<T> {
  cases?: T[]
}

/**
 * 加载 YAML fixture 中的 `cases` 数组。
 * @param fixtureRelativePath - 相对于 `shared/fixtures` 的文件路径，如 `saucedemo-login.cases.yaml`
 * @returns 非空的用例数组
 * @throws 文件不存在、YAML 解析失败、或 `cases` 缺失/为空时抛出明确错误
 */
export function loadYamlCases<T>(fixtureRelativePath: string): T[] {
  if (!fixtureRelativePath || typeof fixtureRelativePath !== 'string') {
    throw new Error('fixtureRelativePath must be a non-empty string')
  }

  const currentFile = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFile)
  const fixtureFile = path.resolve(currentDir, '../fixtures', fixtureRelativePath)

  let raw = ''
  try {
    raw = readFileSync(fixtureFile, 'utf8')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read YAML fixture "${fixtureRelativePath}" (${fixtureFile}): ${message}`)
  }

  let parsed: ParsedCases<T>
  try {
    parsed = yaml.load(raw) as ParsedCases<T>
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse YAML fixture "${fixtureRelativePath}" (${fixtureFile}): ${message}`)
  }

  if (!Array.isArray(parsed?.cases) || parsed.cases.length === 0) {
    throw new Error(`YAML fixture "${fixtureRelativePath}" must contain a non-empty "cases" array`)
  }

  return parsed.cases
}

/**
 * 按用例 `name` 子串过滤（用于本地只跑一条，便于对照 YAML 调试）。
 * @param nameSubstring - 环境变量等传入的过滤串；空则返回全部
 */
export function filterYamlCasesByName<T extends { name: string }>(
  cases: T[],
  nameSubstring?: string
): T[] {
  const filter = nameSubstring?.trim()
  if (!filter) return cases

  const matched = cases.filter((c) => c.name.includes(filter))
  if (matched.length === 0) {
    throw new Error(
      `用例名过滤「${filter}」未匹配任何条目。可选: ${cases.map((c) => c.name).join(' | ')}`
    )
  }
  return matched
}
