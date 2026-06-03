# Web 端工具（WebdriverIO Browser）

本目录存放 **仅用于 Web E2E** 的辅助函数（如浏览器窗口、Cookie、本地存储等）。

跨端复用的能力请放在 `shared/utils/` 根目录（如 `testCaseLoader.util.ts`、`wait.util.ts`）。

新增 Web 工具时建议：

- 文件名：`*.util.ts`
- 文件顶部添加 `@module shared/utils/web/...` 说明
- 在 spec 中通过相对路径或 `@shared/utils/web/...` 导入
