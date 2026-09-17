# PDF小匠商店提交材料

以下内容已经按当前 GitHub 仓库填写，可以直接复制到商店后台。

## 通用信息

- 产品名称：`PDF小匠 — 本地 PDF 工具`
- 英文名称：`PDF小匠 — Local PDF Tools`
- 类别：工具 / Tools
- 版本：`1.0.0`
- 定价：免费
- 可见性：公开
- 单一用途：`在用户设备本地创建、压缩、合并、拆分和导出 PDF 文件，不上传文档。`
- Single purpose: `Create, compress, merge, split, and export PDF files locally on the user's device without uploading documents.`
- 主页 URL：`https://github.com/twodog41/PDF-`
- 支持 URL：`https://twodog41.github.io/PDF-/support.html`
- 隐私政策 URL：`https://twodog41.github.io/PDF-/privacy.html`

## 简短说明

中文（132 字符以内）：

> 合并、拆分、目标压缩、图片与 DOCX 转 PDF、PDF 转图片。无需登录，文件不上传。

English:

> Merge, split, target-size compress, create PDFs from images or DOCX, and export PDF pages locally.

## 中文详细说明

PDF小匠是一个不登录、不上传、没有广告的本地 PDF 工具。

只保留五个常用入口：

• 合并 PDF：通过页面缩略图调整顺序后合并

• 拆分 PDF：提取指定页，或逐页打包下载

• 压缩到目标大小：针对 2MB、5MB、10MB、20MB、25MB 等上传限制

• 转为 PDF：支持 JPG、PNG 和 DOCX

• PDF 转图片：导出 JPG 或 PNG，多页自动打包 ZIP

所有文件只在当前设备中处理。扩展不申请网站访问权限，不包含服务器、账户、广告、统计 SDK 或远程执行代码，断网也能使用。

注意：强压缩可能把页面转换为图像，影响文字搜索、链接、表单和数字签名。DOCX 使用浏览器本地排版，复杂表格、浮动对象和特殊字体可能与 Microsoft Word 略有差异。

## English detailed description

PDF小匠 is a private, offline PDF toolkit with no account, uploads, ads, analytics, backend, or remotely hosted code.

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
- 数据披露说明：`扩展会在设备内临时处理用户主动选择的文件，但不会从设备收集、传输或保留任何数据；数据类型不勾选。`

审核测试说明：

> 点击扩展图标会显示五个工具入口。选择任一入口后，在完整标签页中选择本地文件。无需账户或测试凭据。建议使用两个普通 PDF 测试合并、一个多页 PDF 测试拆分和导出、JPG/PNG 测试转 PDF、普通 DOCX 测试预览后打印。所有功能在断网状态下可运行。

English reviewer note:

> Click the extension icon to see five workflow entries. Open any entry and choose local files in the full-page interface. No account or test credentials are required. Test with two PDFs for merge, one multi-page PDF for split/export, JPG or PNG images for PDF creation, and a regular DOCX for local preview and printing. All features work offline.

## 图形资源

- 128×128 图标：`public/icons/icon-128.png`
- 300×300 商店图标：`store-assets/logo-300x300.png`
- 440×280 小宣传图：`store-assets/promo-small-440x280.png`
- 1400×560 大宣传图：`store-assets/promo-marquee-1400x560.png`
- 1280×800 截图：
  - `store-assets/screenshot-home-1280x800.png`
  - `store-assets/screenshot-merge-1280x800.png`
  - `store-assets/screenshot-compress-1280x800.png`

## 上传文件

- Chrome：`artifacts/pdf-xiaojiang-chrome-1.0.0.zip`
- Edge：`artifacts/pdf-xiaojiang-edge-1.0.0.zip`
- 校验和：`artifacts/SHA256SUMS.txt`

## 首次发布前：GitHub 与公开页面

1. GitHub 仓库已发布到 `https://github.com/twodog41/PDF-`。
2. 在 GitHub Settings → Pages 中选择从 `main` 分支的 `/docs` 发布。
3. 用无痕窗口打开隐私政策 URL，确认无需登录即可访问，再开始商店提交。

## Chrome Web Store 上架步骤

官方入口：[Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)。官方流程：[注册](https://developer.chrome.com/docs/webstore/register/)、[发布](https://developer.chrome.com/docs/webstore/publish/)。

1. 使用长期持有的 Google 账号登录，开启两步验证，完成一次性开发者注册付费。
2. 在 Account 页面填写发布者名称 `PDF小匠`、联系邮箱并完成邮箱验证。
3. 点击 **Add new item**，上传 `artifacts/pdf-xiaojiang-chrome-1.0.0.zip`。
4. 在 **Store Listing** 填入本文件的中英文说明，类别选 **Tools**，上传 128×128 图标、三张截图和两张宣传图。
5. 在 **Privacy practices**：粘贴“单一用途”；权限列表应为空；远程代码选 **No**；数据类型均不勾选并完成 Limited Use 声明；填写公开隐私政策 URL。
6. 在 **Distribution** 选择免费、公开及目标地区；本项目无需测试账号。
7. 点击 **Submit for Review**。首次发布建议关闭自动发布，审核通过后先检查商店预览，再手动发布。

## Microsoft Edge Add-ons 上架步骤

官方入口：[Partner Center](https://partner.microsoft.com/dashboard/)。官方流程：[注册 Edge 开发者](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/create-dev-account)、[发布扩展](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)。Edge 扩展开发者注册目前不收费。

1. 用个人 Microsoft 账号注册 Edge Program；个人开源项目选择 **Individual**。账号类型与国家/地区提交后不能直接更改。
2. 进入 Partner Center → **Edge** → **Create new extension**，上传 `artifacts/pdf-xiaojiang-edge-1.0.0.zip`。
3. **Availability** 选择 **Public** 和目标市场；**Properties** 选择工具类目，填写主页与支持地址。
4. **Privacy**：粘贴“单一用途”；权限应为空；远程代码选 **No**；数据收集项不勾选；填写公开隐私政策 URL。
5. **Store listings** 分别完成中文和英文条目。上传 300×300 图标、宣传图和三张 1280×800 截图；详细说明直接使用本文件内容。
6. **Notes for certification** 粘贴上面的英文审核测试说明，点击 **Publish** 提交认证。
7. 审核通过并上架后，将 Chrome 和 Edge 的正式商店链接加入 README，再创建 GitHub Release 并附上两个 ZIP 与 `SHA256SUMS.txt`。

## 后续更新

每次更新先递增 `public/manifest.json` 与 `package.json` 的版本号，执行 `npm run e2e` 和 `npm run package`，再向两个后台上传同版本的新 ZIP。不要改用浏览器打包出的 CRX 文件。
