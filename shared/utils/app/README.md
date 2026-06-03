# App 端工具（Appium / WebdriverIO Mobile）

本目录三类能力：**环境配置**、**用例编排（spec）**、**页面内 UI 操作（Page）**。  
`app-scroll` / `app-list-collect` 已合并为 `app-ui.util.ts`，详见 [变更说明.txt](./变更说明.txt)。

## 文件一览

| 文件 | 谁该用 | 作用 |
|------|--------|------|
| `app-config.util.ts` | 按需 | 解析 `.env` / capabilities 中的 App 标识 |
| `app-lifecycle.util.ts` | **仅 spec** | App 关闭、重启、失败重试 |
| `app-ui.util.ts` | **Page** | 滑动查找、列表行文本采集 |

## 职责分层

```
spec   → app-lifecycle（before / after / retryWithMobileAppRestart）
Page   → app-ui（scrollUntil、scrollAndCollectListRows）
.env   → wdio.conf.ts + app-config
```

Page **不要** 导入 `app-lifecycle`。

---

## app-ui.util.ts

底层均通过 WebdriverIO 的 `$` / `$$` 与 Appium 会话操作元素。  
列表与查找相关的「选择器」参数类型为 **string**，写法与你在 Page 里写 `$('...')` 时相同。

### 选择器 `rowSelector` 是什么？

`rowSelector` **不是**只能用 XPath，而是 **WebdriverIO  locator 字符串**（与 `$()` / `$$()` 第一个参数相同），例如：

| 写法示例 | 类型 | 说明 |
|----------|------|------|
| `//android.widget.LinearLayout[@resource-id="com.android.settings:id/xxx"]` | XPath | 项目里最常用 |
| `android=new UiSelector().resourceId("com.android.settings:id/xxx")` | UiAutomator2 | Android 原生定位 |
| `~关于手机` | accessibility id | 无障碍描述 |
| `#com.android.settings:id/xxx` 或 id 相关简写 | resource-id | 视 WDIO/Appium 版本而定 |

工具内部对 `rowSelector` 的执行是：`$$(rowSelector)` 得到**多个行元素**（列表）；`single: true` 时只取第一个匹配。

字段 text **不需要**你再写 title/summary 的 XPath，由工具按「行根节点 → 同级子节点」自动解析（见下文 `extractListRowTexts`）。

---

### `scrollUntil` — 边滑边查找

#### 入参

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `finder` | `() => Promise<T \| null>` | 是 | **你在 Page 里写的「当前屏查找逻辑」**。在**不滑动**的前提下尝试定位；找到则返回任意类型 `T`（常用：XPath 字符串、元素、布尔值等），找不到返回 `null` |
| `overrides` | `ScrollStrategyOverrides` | 否 | 滑动策略。`preset: 'normal' \| 'strict'`；可覆盖 `maxSwipes`、`percent`、滑动区域比例等 |

`ScrollStrategyOverrides` 常用字段：

| 字段 | 默认（随 preset） | 说明 |
|------|-------------------|------|
| `preset` | `normal` | `normal` 宽区域 / `strict` 窄区域 |
| `maxSwipes` | normal→6，strict→4 | 最多额外下滑次数 |

#### 出参

| 类型 | 含义 |
|------|------|
| `Promise<T \| null>` | 找到 → 返回 `finder` 给出的 `T`；滑到上限仍没有 → `null` |

#### 执行过程

1. 按 `overrides` 生成滑动策略（区域、次数上限）。
2. **循环**（最多 `maxSwipes + 1` 轮「查找」）：
   - 调用一次 `finder()`（只查**当前屏**）。
   - 若返回值非 `null` → **结束**，返回该值。
   - 若已达滑动上限 → **结束**，返回 `null`。
   - 否则执行一次 `swipeDown`（`mobile: scrollGesture` 向下），进入下一轮。
3. 不在 `scrollUntil` 内点击；点击由 Page 在拿到返回值后自行处理。

#### 示例（对应设置页「滑动找文案再点击」）

```ts
import { $ } from '@wdio/globals'
import { scrollUntil } from '../../../shared/utils/app/app-ui.util.js'

// 入参 1：finder —— 定义「什么叫找到了」（这里：返回可点击节点的 XPath）
async function findAboutEntry(): Promise<string | null> {
  const keyword = '关于手机'
  const selector = `//*[@text="${keyword}" or contains(@text, "${keyword}")]`
  return (await $(selector).isExisting()) ? selector : null
}

// 入参 2：overrides —— 滑动策略（可选）
const scrollOpts = { preset: 'normal' as const, maxSwipes: 6 }

// 调用
const xpath = await scrollUntil(findAboutEntry, scrollOpts)

// 出参：string | null → 再决定是否点击
if (xpath) {
  await $(xpath).click()
}
```

---

### `scrollAndCollectListRows` — 边滑边采集列表行

#### 入参

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `config` | `ListCollectConfig` | 是 | 列表采集配置，见下表 |
| `overrides` | `ScrollStrategyOverrides` | 否 | 与 `scrollUntil` 相同，控制下滑方式与次数 |

`ListCollectConfig`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `rowSelector` | `string` | 是 | **行容器** locator（见上文「选择器」）。`$$` 匹配到的每一个元素视为「一行」 |
| `single` | `boolean` | 否 | 默认 `false`。`true` 时只处理**第一个**匹配行 |
| `skipEmptyRows` | `boolean` | 否 | 默认 `true`。跳过解析后无任何 text 的行 |

#### 出参

| 类型 | 含义 |
|------|------|
| `Promise<ListRowTexts[]>` | 多行数组。每一行 `ListRowTexts` = `(string \| string[])[]`（一维或混合 list，见下） |

单行 `ListRowTexts` 的含义（由 `extractListRowTexts` 生成）：

- 对行根节点的**每个直接子节点**（同级）：
  - 子节点自己有 text → 一项 `string`
  - 子节点无 text → 该项为其子孙中带 text 的文案组成的 `string[]`
- 若最终只有**一个**有效单元且为 `string[]` → 提升为一维 `string[]`
- 设置页典型一行两个 TextView → `['IMEI', '868425044372761']`

#### 执行过程

1. 根据 `overrides` 生成滑动策略。
2. **循环**（每轮 = 采当前屏 + 可能下滑）：
   - `collectListRowsOnScreen(config)`：
     - `$$`(`rowSelector`) 得到当前屏所有行元素；
     - 对每个行元素调用 `extractListRowTexts` 得到 `ListRowTexts`；
     - 按 `skipEmptyRows` 过滤空行。
   - 将本屏各行按 `JSON.stringify(row)` **去重**后追加到总结果（避免滑动时重复行）。
   - 若已达 `maxSwipes` 或 `swipeDown` 失败 → 结束。
   - 否则下滑，继续下一轮。
3. 返回合并后的 `ListRowTexts[]`。

#### 示例（设置 → Android 版本详情列表）

```ts
import { scrollAndCollectListRows, formatListRow } from '../../../shared/utils/app/app-ui.util.js'

// 入参 config.rowSelector：行容器（XPath 示例；也可换成 UiSelector 等 WDIO 支持的写法）
const config = {
  rowSelector:
    '//androidx.recyclerview.widget.RecyclerView[@resource-id="com.android.settings:id/recycler_view"]/android.widget.LinearLayout/android.widget.RelativeLayout',
  // single: false,      // 默认：采所有匹配行
  // skipEmptyRows: true, // 默认：跳过空行
}

// 入参 overrides：滑动策略（可选）
const scrollOpts = { preset: 'normal' as const, maxSwipes: 8 }

// 调用
const rows = await scrollAndCollectListRows(config, scrollOpts)

// 出参：ListRowTexts[]，例如 [['Android 版本','14'], ['IMEI','868425044372761'], ...]
for (const row of rows) {
  console.log(formatListRow(row))
}
```

---

### 其它 API（摘要）

#### `swipeDown(strategy)`

| | |
|--|--|
| **入参** | `ScrollStrategy`（完整策略对象，通常由 `resolveScrollStrategy` 得到） |
| **出参** | `Promise<boolean>` 是否成功发起滑动手势 |
| **过程** | 按策略计算屏幕区域 → `mobile: scrollGesture` 向下滑一次 |

#### `collectListRowsOnScreen(config)`

| | |
|--|--|
| **入参** | `ListCollectConfig` |
| **出参** | `Promise<ListRowTexts[]>` 仅**当前屏** |
| **过程** | `$$`(rowSelector) → 每行 `extractListRowTexts`，不滑动 |

#### `collectSingleRow({ rowSelector })`

| | |
|--|--|
| **入参** | `{ rowSelector: string }` |
| **出参** | `Promise<ListRowTexts>` 第一个匹配行；找不到抛错 |
| **过程** | 等待存在 → `$$` 取首行 → `extractListRowTexts` |

#### `extractListRowTexts(rowElement)`

| | |
|--|--|
| **入参** | 已定位的 `WebdriverIO.Element`（行根节点） |
| **出参** | `Promise<ListRowTexts>` |
| **过程** | 遍历直接子节点解析 text；无子节点时 fallback 整行 text / 子孙 text |

#### `formatListRow(row)`

| | |
|--|--|
| **入参** | 单行 `ListRowTexts` |
| **出参** | `string` 便于 `console.log` |
| **过程** | `string` 原样，`string[]` 格式化为 `[a, b]`，用 ` \| ` 连接各单元 |

---

## app-lifecycle.util.ts（spec）

### `restartMobileApp(target?, options?)`

| | |
|--|--|
| **入参** | `target` 默认 `resolveMobileAppTarget()`；`options`: `terminatePauseMs`、`activatePauseMs` |
| **出参** | `Promise<void>` |
| **过程** | `terminateApp` → `activateApp`，失败则 `mobile: startActivity`（Android） |

### `terminateMobileApp(target?, options?)`

| | |
|--|--|
| **入参** | 同上 |
| **出参** | `Promise<void>` |
| **过程** | `terminateApp`（App 已关则忽略错误） |

### `retryWithMobileAppRestart(name, action, options?)`

| | |
|--|--|
| **入参** | `name` 错误信息用；`action` 异步函数；`options.maxAttempts` 默认 2 |
| **出参** | `Promise<T>` 为 `action` 返回值 |
| **过程** | 执行 `action` → 失败则 `restartMobileApp` 再试，直至成功或次数用尽后抛错 |

```ts
import {
  restartMobileApp,
  terminateMobileApp,
  retryWithMobileAppRestart,
} from '../../../shared/utils/app/app-lifecycle.util.js'

describe('场景', () => {
  before(async () => await restartMobileApp())
  after(async () => await terminateMobileApp())

  it('用例', async () => {
    await retryWithMobileAppRestart('打开目标页', async () => {
      await page.openTargetScreen()
    })
  })
})
```

---

## app-config.util.ts

从 `.env` 读取（与 `wdio.conf.ts` 一致）：`MOBILE_PLATFORM`、`ANDROID_APP_PACKAGE`、`ANDROID_APP_ACTIVITY`、`IOS_BUNDLE_ID`。

| API | 入参 | 出参 |
|-----|------|------|
| `getMobilePlatform()` | 无 | `'android' \| 'ios'` |
| `getMobileAppTargetFromEnv()` | 无 | `MobileAppTarget` |
| `resolveMobileAppTarget()` | 无 | 优先 env，Android 可回退 capabilities |
| `getMobileAppId(target?)` | 可选 target | `package` 或 `bundleId` 字符串 |

---

## 项目内参考

| 路径 | 说明 |
|------|------|
| `tests/mobile/pages/android-settings.page.ts` | `scrollUntil` + `scrollAndCollectListRows` |
| `tests/mobile/specs/android-settings-device-info.spec.ts` | lifecycle 钩子 + `formatListRow` |

运行：`pnpm run test:mobile`
