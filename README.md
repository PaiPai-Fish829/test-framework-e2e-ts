# test-automation-hub

一个基于 TypeScript 的统一测试框架，覆盖：

- Web E2E（Playwright）
- App 自动化（WebdriverIO + Appium）
- API 测试（Playwright request）
- Unit 测试（Vitest）

## 1. 环境要求

- Node.js 20+
- pnpm（建议通过 Corepack）
- Java 17+（Appium Android 常用）
- Android SDK（移动端 Android 测试）
- Xcode（如需 iOS 测试，仅 macOS）
- Appium 3.x

## 2. 安装步骤

```bash
corepack enable
pnpm install
pnpm run pw:install
```

## 3. 环境变量配置

1. 复制模板：

```bash
cp .env.example .env
```

2. 常用变量：

- `WEB_BASE_URL`：Web 测试目标地址
- `API_BASE_URL`：API 测试目标地址
- `API_TOKEN`：API 鉴权 token（可选）
- `SEARCH_ENGINE`：`baidu` 或 `google`
- `MOBILE_PLATFORM`：`android` 或 `ios`
- `APPIUM_HOST` / `APPIUM_PORT`：Appium 服务地址

## 4. ESLint 与编译前检查

### 4.1 ESLint 常用命令

```bash
# 常规检查
pnpm run lint

# 自动修复（包含导入排序、可自动修复的语法问题）
pnpm run lint:fix

# 格式化（可选，通常放在 lint:fix 后）
pnpm run format
```

### 4.2 ESLint 调试命令（排查规则冲突/配置不生效）

```bash
# 输出 ESLint 调试日志
pnpm exec eslint . --debug

# 查看某个文件最终生效的配置
pnpm exec eslint --print-config tests/web/specs/login.spec.ts
```

### 4.3 编译前检查（推荐每次提交前执行）

```bash
# 语法与类型
pnpm run lint
pnpm run typecheck

# 最小回归
pnpm run test:unit
pnpm run test:api
```

如果你本地已安装 Playwright 浏览器，也建议补充：

```bash
pnpm run test:web
```

## 5. 运行测试

```bash
# Web
pnpm run test:web
corepack pnpm run test:web:wdio -- --spec ./tests/web/specs/saucedemo-login.spec.ts


# App
pnpm run test:mobile

# API
pnpm run test:api

# Unit
pnpm run test:unit

# E2E（Web + API + App）
pnpm run test:e2e

# 全量（Unit + E2E）
pnpm run test:all
```

## 6. 生成与查看报告

```bash
# 生成统一摘要报告
pnpm run test:report

# 打开 Playwright HTML 报告
pnpm exec playwright show-report reports/playwright-html
```

WDIO 产物在 `reports/wdio/wdio-junit.xml`，Vitest 产物在 `reports/vitest/vitest-report.json`。

## 7. 调试（VS Code launch.json 示例）

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Playwright Web",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test", "tests/web/specs/login.spec.ts", "--project=chromium"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug API Spec",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test", "tests/api/specs/user.spec.ts", "--project=api"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

## 8. 如何新增测试用例

- Web：在 `tests/web/pages` 写 Page Object，在 `tests/web/specs` 写 spec， 在`tests/web/flows` 写业务代码。
- API：在 `tests/api/specs` 写接口用例，优先复用 `shared/http/apiClient.ts`。
- App：在 `tests/mobile/pages` 写页面封装，在 `tests/mobile/specs` 写移动端场景。
- Unit：在 `tests/unit/tests` 写纯函数测试。
- 复用类型与工具：放在 `shared/types`、`shared/utils`、`shared/fixtures`。

### 8.1 YAML 测试用例加载工具

项目已提供通用 YAML 用例加载器：`shared/utils/testCaseLoader.util.ts`。

- 方法：`loadYamlCases<T>(fixtureRelativePath: string): T[]`
- 入参：`fixtureRelativePath` 为相对于 `shared/fixtures` 的文件路径
  - 例如：`saucedemo-login.cases.yaml`
- 能力：
  - 自动解析工具文件位置并定位 `shared/fixtures` 下的 YAML 文件
  - 读取并解析 YAML
  - 校验 YAML 必须包含非空 `cases` 数组
  - 读取失败、解析失败、结构错误时抛出清晰错误信息

在 spec 中的使用示例：

```ts
import { loadYamlCases } from '../../../shared/utils/testCaseLoader.util.js'

type LoginCase = LoginSuccessCase | LoginErrorCase

const loginCases = loadYamlCases<LoginCase>('saucedemo-login.cases.yaml')
```

## 9. CI/CD 示例（GitHub Actions）

```yaml
name: test-automation-hub
on:
  push:
    branches: [main]
  pull_request:

jobs:
  web-api-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: corepack enable
      - run: pnpm install
      - run: pnpm run pw:install
      - run: pnpm run test:unit
      - run: pnpm run test:web
      - run: pnpm run test:api
```

> Appium 移动端测试通常需要自建 runner（带 Android SDK/iOS 环境），建议单独开 job。

## 10. 最快验证命令

```bash
pnpm install
pnpm run pw:install
pnpm run test:all
```

如果暂时没有移动端环境，先执行：

```bash
pnpm run test:web
pnpm run test:api
pnpm run test:unit
```
