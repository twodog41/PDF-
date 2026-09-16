# FilePassport 商店提交材料

发布前只需完成带 `【账号信息】` 的项目，其余内容可以直接复制到商店后台。

## 通用信息

- 产品名称：`FilePassport — 本地 PDF 工具`
- 英文名称：`FilePassport — Local PDF Tools`
- 类别：工具 / Tools
- 版本：`1.0.0`
- 定价：免费
- 可见性：公开
- 单一用途：`在用户设备本地创建、压缩、合并、拆分和导出 PDF 文件，不上传文档。`
- 主页 URL：`https://github.com/【账号信息：GitHub 用户名】/filepassport`
- 支持 URL：`https://【账号信息：GitHub 用户名】.github.io/filepassport/support.html`
- 隐私政策 URL：`https://【账号信息：GitHub 用户名】.github.io/filepassport/privacy.html`

## 简短说明

中文（132 字符以内）：

> 合并、拆分、目标压缩、图片与 DOCX 转 PDF、PDF 转图片。无需登录，文件不上传。

English:

> Merge, split, target-size compress, create PDFs from images or DOCX, and export PDF pages locally.

## 中文详细说明

FilePassport 是一个不登录、不上传、没有广告的本地 PDF 工具。

只保留五个常用入口：

• 合并 PDF：通过页面缩略图调整顺序后合并

• 拆分 PDF：提取指定页，或逐页打包下载

• 压缩到目标大小：针对 2MB、5MB、10MB、20MB、25MB 等上传限制

• 转为 PDF：支持 JPG、PNG 和 DOCX

• PDF 转图片：导出 JPG 或 PNG，多页自动打包 ZIP

所有文件只在当前设备中处理。扩展不申请网站访问权限，不包含服务器、账户、广告、统计 SDK 或远程执行代码，断网也能使用。

注意：强压缩可能把页面转换为图像，影响文字搜索、链接、表单和数字签名。DOCX 使用浏览器本地排版，复杂表格、浮动对象和特殊字体可能与 Microsoft Word 略有差异。

## English detailed description

FilePassport is a private, offline PDF toolkit with no account, uploads, ads, analytics, backend, or remotely hosted code.

Five focused workflows:

• Merge PDFs and reorder pages visually

• Split PDFs, extract selected pages, or export each page in a ZIP

• Compress toward practical upload limits such as 2 MB, 5 MB, 10 MB, 20 MB, and 25 MB

• Create PDFs from JPG, PNG, or DOCX files

• Export PDF pages as JPG or PNG

Files are processed only on the user's device. The extension requests no website access or extension permissions and works offline.

Strong compression may rasterize pages and affect searchable text, links, forms, and digital signatures. DOCX uses local browser layout, so complex tables, floating objects, and uncommon fonts may differ from Microsoft Word.

## 隐私与审核答案

- 是否收集或使用用户数据：`否`
- 是否出售用户数据：`否`
- 是否将数据用于与单一用途无关的目的：`否`
- 是否将数据用于信用或贷款：`否`
- 是否使用远程代码：`否`
- 是否使用外部服务器：`否`
- 扩展权限：`无`
- 主机权限：`无`
- 权限理由：`不适用。用户通过原生文件选择器主动选择文件，输出通过浏览器标准下载能力保存。`

审核测试说明：

> 点击扩展图标会显示五个工具入口。选择任一入口后，在完整标签页中选择本地文件。无需账户或测试凭据。建议使用两个普通 PDF 测试合并、一个多页 PDF 测试拆分和导出、JPG/PNG 测试转 PDF、普通 DOCX 测试预览后打印。所有功能在断网状态下可运行。

## 图形资源

- 128×128 图标：`public/icons/icon-128.png`
- 440×280 小宣传图：`store-assets/promo-small-440x280.png`
- 1400×560 大宣传图：`store-assets/promo-marquee-1400x560.png`
- 1280×800 截图：
  - `store-assets/screenshot-home-1280x800.png`
  - `store-assets/screenshot-merge-1280x800.png`
  - `store-assets/screenshot-compress-1280x800.png`

## 上传文件

- Chrome：`artifacts/filepassport-chrome-1.0.0.zip`
- Edge：`artifacts/filepassport-edge-1.0.0.zip`
- 校验和：`artifacts/SHA256SUMS.txt`

## 账号操作清单

1. 【账号信息】创建 GitHub 仓库 `filepassport`，推送本目录。
2. 在 GitHub Settings → Pages 中选择从 `main` 分支的 `/docs` 发布。
3. 将上面的三个 URL 中 GitHub 用户名替换为实际值，并确认可以公开访问。
4. 注册或登录 Chrome Web Store 开发者后台，上传 Chrome ZIP，填写材料后提交审核。
5. 注册或登录 Microsoft Partner Center，上传 Edge ZIP，填写材料后提交认证。
6. 商店批准后，把正式商店链接加入 README。
