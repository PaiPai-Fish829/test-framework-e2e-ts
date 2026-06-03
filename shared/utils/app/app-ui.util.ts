/**
 * @module shared/utils/app/app-ui
 * @description 移动端页面内操作：滑动查找 + 列表行文本采集（Appium `mobile: scrollGesture` + XPath）。
 *
 * 滑动预设：`normal`（默认，maxSwipes 6）| `strict`（居中窄区域，maxSwipes 4）
 *
 * 列表采集：仅配置 `rowSelector`，按行内同级子节点自动提取 text（`string | string[]` 混合）。
 */

import { $, $$, browser } from '@wdio/globals'

// --- 滑动 ---

export type ScrollPreset = 'normal' | 'strict'

export type ScrollStrategy = {
  preset: ScrollPreset
  maxSwipes: number
  leftRatio: number
  topRatio: number
  widthRatio: number
  heightRatio: number
  percent: number
}

export type ScrollStrategyOverrides = {
  preset?: ScrollPreset
  maxSwipes?: number
  leftRatio?: number
  topRatio?: number
  widthRatio?: number
  heightRatio?: number
  percent?: number
}

type ScrollAreaPreset = Pick<
  ScrollStrategy,
  'leftRatio' | 'topRatio' | 'widthRatio' | 'heightRatio' | 'percent'
>

const SCROLL_AREA_PRESETS: Record<ScrollPreset, ScrollAreaPreset> = {
  normal: { leftRatio: 0.1, topRatio: 0.2, widthRatio: 0.8, heightRatio: 0.6, percent: 0.75 },
  strict: { leftRatio: 0.25, topRatio: 0.35, widthRatio: 0.5, heightRatio: 0.35, percent: 0.55 },
}

const DEFAULT_MAX_SWIPES: Record<ScrollPreset, number> = {
  normal: 6,
  strict: 4,
}

export function resolveScrollStrategy(overrides: ScrollStrategyOverrides = {}): ScrollStrategy {
  const preset = overrides.preset ?? 'normal'
  const area = SCROLL_AREA_PRESETS[preset]
  return {
    preset,
    maxSwipes: overrides.maxSwipes ?? DEFAULT_MAX_SWIPES[preset],
    leftRatio: overrides.leftRatio ?? area.leftRatio,
    topRatio: overrides.topRatio ?? area.topRatio,
    widthRatio: overrides.widthRatio ?? area.widthRatio,
    heightRatio: overrides.heightRatio ?? area.heightRatio,
    percent: overrides.percent ?? area.percent,
  }
}

export async function swipeDown(strategy: ScrollStrategy): Promise<boolean> {
  try {
    const { width, height } = await browser.getWindowSize()
    return Boolean(
      await browser.execute('mobile: scrollGesture', {
        left: Math.floor(width * strategy.leftRatio),
        top: Math.floor(height * strategy.topRatio),
        width: Math.floor(width * strategy.widthRatio),
        height: Math.floor(height * strategy.heightRatio),
        direction: 'down',
        percent: strategy.percent,
      })
    )
  } catch {
    return false
  }
}

/** 边滑边查找：当前屏先 finder，未命中则下滑 */
export async function scrollUntil<T>(
  finder: () => Promise<T | null>,
  overrides?: ScrollStrategyOverrides
): Promise<T | null> {
  const strategy = resolveScrollStrategy(overrides)
  for (let swipes = 0; swipes <= strategy.maxSwipes; swipes += 1) {
    const found = await finder()
    if (found) return found
    if (swipes === strategy.maxSwipes) break
    if (!(await swipeDown(strategy))) break
  }
  return null
}

// --- 列表采集 ---

export type ListRowCell = string | string[]
export type ListRowTexts = ListRowCell[]

export type ListCollectConfig = {
  rowSelector: string
  single?: boolean
  skipEmptyRows?: boolean
}

function rowDedupeKey(row: ListRowTexts): string {
  return JSON.stringify(row)
}

function isRowEmpty(row: ListRowTexts): boolean {
  return row.length === 0 || row.every((cell) => (typeof cell === 'string' ? cell.length === 0 : cell.length === 0))
}

async function collectDescendantTexts(node: WebdriverIO.Element): Promise<string[]> {
  const texts: string[] = []
  const seen = new Set<string>()

  const visit = async (el: WebdriverIO.Element): Promise<void> => {
    const own = (await el.getText()).trim()
    if (own && !seen.has(own)) {
      seen.add(own)
      texts.push(own)
    }
    for (const child of await el.$$('./*')) {
      await visit(child)
    }
  }

  for (const child of await node.$$('./*')) {
    await visit(child)
  }
  return texts
}

async function extractSiblingCell(sibling: WebdriverIO.Element): Promise<ListRowCell | null> {
  const ownText = (await sibling.getText()).trim()
  if (ownText.length > 0) return ownText

  const childTexts = await collectDescendantTexts(sibling)
  if (childTexts.length === 0) return null
  if (childTexts.length === 1) return childTexts[0]
  return childTexts
}

function normalizeRowCells(cells: ListRowCell[]): ListRowTexts {
  if (cells.length === 0) return []
  if (cells.length === 1) {
    const only = cells[0]
    return typeof only === 'string' ? [only] : only
  }
  return cells
}

export async function extractListRowTexts(rowElement: WebdriverIO.Element): Promise<ListRowTexts> {
  const cells: ListRowCell[] = []
  let hasDirectChild = false

  for (const sibling of await rowElement.$$('./*')) {
    hasDirectChild = true
    const cell = await extractSiblingCell(sibling)
    if (cell !== null) cells.push(cell)
  }

  if (hasDirectChild) return normalizeRowCells(cells)

  const own = (await rowElement.getText()).trim()
  if (own) return [own]

  const fallback = await collectDescendantTexts(rowElement)
  if (fallback.length === 1) return [fallback[0]]
  if (fallback.length > 1) return fallback
  return []
}

export async function collectSingleRow(config: Pick<ListCollectConfig, 'rowSelector'>): Promise<ListRowTexts> {
  await $(config.rowSelector).waitForExist({ timeout: 5000 })
  for (const rowElement of await $$(config.rowSelector)) {
    return extractListRowTexts(rowElement)
  }
  throw new Error(`未找到行元素: ${config.rowSelector}`)
}

export async function collectListRowsOnScreen(config: ListCollectConfig): Promise<ListRowTexts[]> {
  const { rowSelector, single = false, skipEmptyRows = true } = config

  if (single) {
    const row = await collectSingleRow({ rowSelector })
    if (skipEmptyRows && isRowEmpty(row)) return []
    return [row]
  }

  const rows: ListRowTexts[] = []
  for (const rowElement of await $$(rowSelector)) {
    const row = await extractListRowTexts(rowElement)
    if (skipEmptyRows && isRowEmpty(row)) continue
    rows.push(row)
  }
  return rows
}

/** 边下滑边按行采集，按整行 JSON 去重 */
export async function scrollAndCollectListRows(
  config: ListCollectConfig,
  overrides?: ScrollStrategyOverrides
): Promise<ListRowTexts[]> {
  const strategy = resolveScrollStrategy(overrides)
  const seen = new Set<string>()
  const merged: ListRowTexts[] = []

  for (let swipes = 0; swipes <= strategy.maxSwipes; swipes += 1) {
    for (const row of await collectListRowsOnScreen(config)) {
      const key = rowDedupeKey(row)
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(row)
      }
    }
    if (swipes === strategy.maxSwipes) break
    if (!(await swipeDown(strategy))) break
  }

  return merged
}

export function formatListRow(row: ListRowTexts): string {
  return row
    .map((cell) => (typeof cell === 'string' ? cell : `[${cell.join(', ')}]`))
    .join(' | ')
}
