# PDF小匠

> 文件不过云，处理完就走。

PDF小匠是一个面向 Microsoft Edge 和 Google Chrome 的本地 PDF 扩展。无需登录，没有广告，文件不会上传到服务器。

![PDF小匠首页](store-assets/screenshot-home-1280x800.png)

## 功能

- 合并 PDF，并通过缩略图调整页面顺序
- 拆分 PDF、提取指定页或逐页导出 ZIP
- 尽量压缩到 2 MB、5 MB、10 MB 等目标大小
- JPG、PNG、DOCX 转为 PDF
- PDF 逐页导出 JPG 或 PNG

DOCX 采用本地预览后调用浏览器打印。普通文档效果最佳；复杂表格、浮动对象、特殊字体和 Word 动态域可能存在排版差异。

## 隐私设计

- Manifest V3 中不声明 `permissions` 或 `host_permissions`
- 不包含服务器、账户、统计 SDK、广告或远程执行代码
- 所有运行时代码随扩展打包，断网可用
- 文件只在当前扩展页面的内存中处理
- 构建会自动检查权限、包结构和依赖漏洞

完整说明见 [隐私政策](PRIVACY.md) 和 [安全政策](SECURITY.md)。

## 本地运行

需要 Node.js 24 或更高版本。

```bash
npm ci
npm run dev
```

浏览器开发者模式安装：

1. 执行 `npm run build`。
2. 打开 `edge://extensions` 或 `chrome://extensions`。
3. 开启“开发人员模式”。
4. 选择“加载解压缩的扩展”，加载 `dist` 目录。

## 验证与打包

```bash
npm test          # 页码解析和压缩预算单元检查
npm run e2e       # 使用本机 Chrome/Edge 验证五条工具链
npm audit         # 依赖安全审计
npm run package   # 生成双商店 ZIP 和 SHA-256
```

商店包输出到 `artifacts/`。Chrome 和 Edge 使用同一套源代码，但分别生成命名清晰的上传包。

## 项目结构

```text
src/              扩展 UI 和本地文件处理
public/           Manifest、语言文件、扩展图标
scripts/          构建验证、E2E、品牌素材和打包脚本
tests/            最小单元检查
store-assets/     商店截图和宣传图
docs/             GitHub Pages 隐私与支持页面
artifacts/        可上传商店包（构建生成，不入库）
```

## 发布

详细字段、审核答案和账号操作见 [STORE_SUBMISSION.md](STORE_SUBMISSION.md)。推送 `v*` 标签后，GitHub Actions 会构建 ZIP、生成校验和并创建 GitHub Release。

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 当前边界

- 不支持旧版 `.doc`，请先另存为 `.docx`
- 不支持设有打开密码的 PDF
- 强压缩可能将页面栅格化，导致文字搜索、链接、表单和数字签名失效
- 极端目标大小不一定能在可读质量下达到；扩展会报告实际结果
- 单文件上限为 500 MB，实际能力还取决于设备内存

## License

[MIT](LICENSE)。第三方组件见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

**English:** PDF小匠 is a zero-permission, offline Chromium extension for merging, splitting, target-size compressing, creating, and exporting PDFs. The project ships no backend, analytics, ads, accounts, or remotely hosted code.
