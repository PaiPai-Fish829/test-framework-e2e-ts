# 测试分层与命名模板（可扩展 Web / App / API）

本模板用于统一项目内测试规范，并允许后续持续追加更多标准，不修改已有说明文档。

## 1. 总体原则

- 单一职责：一个文件只解决一类问题
- 可读优先：通过文件名就能知道用途
- 最小耦合：页面逻辑、业务流程、场景断言分离
- 可扩展：按领域追加章节（Web、App、API、性能等）

## 2. Web（TypeScript + WebdriverIO）规范

### 2.1 目录结构

```text
tests/
  web/
    pages/
      saucedemo-login.page.ts
    flows/
      saucedemo-auth.flow.ts
    specs/
      saucedemo-login.spec.ts
shared/
  fixtures/
    saucedemo-users.fixture.ts
```

### 2.2 一页一文件约束

- 一个业务页面对应一个 `page` 文件
- 该页面相关的状态读取、页面级校验辅助统一放在同一个 page 文件中
- 不为同一页面额外拆分多个 page 文件（除非页面完全独立且无共享语义）

### 2.3 分层职责

- `pages`：元素定位、页面动作、页面状态方法（禁止断言）
  - 示例：`open()`、`login()`、`getText()`、`getTitle()`、`isDisplayed()`
- `flows`：跨步骤业务编排、调用 page、返回结果数据（禁止断言）
  - 示例：`runLoginFlow()`、`runCheckoutFlow()`
- `specs`：数据驱动 + 断言（所有断言统一在 spec）
  - 示例：读取 YAML、循环生成 case、断言标题/错误/URL

### 2.4 命名规范

- Page 文件：`<domain>-<page>.page.ts`
- Flow 文件：`<domain>-<flow>.flow.ts`
- Spec 文件：`<domain>-<scenario>.spec.ts`
- Page 类名：`<Domain><Page>Page`
- Flow 类名：`<Domain><Flow>Flow`

### 2.5 方法命名规范

- 页面动作：动词开头，如 `open`、`fillCredentials`、`submit`、`login`
- 页面状态：`waitFor...`、`get...`、`is...`
- 业务流程：`run...Flow` 或 `<action>Flow`，如 `runLoginFlow`、`runCheckoutFlow`

### 2.6 强约束（必须遵守）

- `pages` 层：只允许定位、操作、读取状态；不允许 `assert/expect`
- `flows` 层：只允许编排步骤并返回结果对象；不允许 `assert/expect`
- `specs` 层：必须承载全部断言；推荐从 YAML/JSON 读取测试数据进行参数化

### 2.7 数据驱动建议（YAML）

- 推荐位置：`shared/fixtures/*.cases.yaml`
- 推荐结构：

```yaml
cases:
  - name: login success
    username: standard_user
    password: secret_sauce
    expectType: success
    expectedTitle: Products
```

- 在 spec 中读取并循环注册 `it(...)`，每条 `case.name` 对应一个可追踪用例

## 3. App（WebdriverIO + Appium）规范（预留/可扩展）

### 3.1 推荐目录

```text
tests/
  mobile/
    pages/
      login.page.ts
    flows/
      auth.flow.ts
    specs/
      login.spec.ts
```

### 3.2 规则建议

- Page 仅封装设备上的元素与操作，不包含业务断言
- Flow 编排端到端步骤（例如登录、切换账号、退出）
- Spec 只表达测试意图与最终断言
- 能力定位优先稳定属性（accessibility id/resource-id），避免脆弱 XPath

## 4. API 规范（预留/可扩展）

- 建议结构：`tests/api/specs` + `shared/http` + `shared/fixtures`
- 一个接口域一组 spec，按业务场景命名，不按方法名堆砌
- 公共客户端、签名、鉴权逻辑放 `shared/http`

## 5. 新增规范的维护方式

- 新规范直接在本文件追加一级章节（如“性能测试规范”）
- 每个新章节至少包含：
  - 目录结构
  - 命名规则
  - 分层职责
  - 最小可运行示例
- 不在多个文件重复写同一规范，避免版本漂移
