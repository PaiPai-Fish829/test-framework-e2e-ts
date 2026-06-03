# shared/utils 工具目录

按测试类型划分，**跨 Web / App / API / Unit 复用**的工具放在本目录根下；仅移动端（Appium）使用的放在 `app/`；仅 WebdriverIO Web 使用的放在 `web/`。

## 目录结构

| 路径 | 说明 |
|------|------|
| `mask.util.ts` | 公用：手机号、邮箱脱敏 |
| `wait.util.ts` | 公用：异步等待与条件轮询 |
| `testCaseLoader.util.ts` | 公用：从 `shared/fixtures` 加载 YAML 参数化用例 |
| `app/` | 移动端：`app-config`、`app-lifecycle`（spec）、`app-ui`（滑动 + 列表采集） |
| `web/` | Web 端专用工具（按需新增） |

## 导入示例

```ts
// 公用
import { loadYamlCases } from '../../../shared/utils/testCaseLoader.util.js'
import { maskPhone } from '../../../shared/utils/mask.util.js'

// App
import { restartMobileApp } from '../../../shared/utils/app/app-lifecycle.util.js'
import { scrollUntil } from '../../../shared/utils/app/app-ui.util.js'

// Web（示例，按实际文件为准）
// import { ... } from '../../../shared/utils/web/xxx.util.js'
```
