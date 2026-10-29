# Yifan Bai · Academic Homepage

一个可直接部署到 GitHub Pages 的中英文学术个人主页。使用 HTML、CSS 和原生 JavaScript，**没有第三方运行时依赖，不需要安装 npm 包**。

已包含：博士生与访学简介、导师信息、本科经历、个人照片、5 篇按类型分组的论文、BibTeX 复制与下载、开源项目、mathlib 贡献、交大与华威双邮箱、手机导航、中英文切换及语言偏好记忆。论文列表展示标题、作者、发表信息及相关链接，已生成在 HTML 中，禁用 JavaScript 时也能阅读。头像与字体均保存在本地。

## 本地预览

在当前目录运行：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开 <http://localhost:8000>。也可以运行 `npm run dev`。如果 8000 端口被占用，换成 8001 等端口。

根目录已包含生成好的 `index.html`，也可以直接用浏览器打开。推荐通过本地服务器预览，方便使用浏览器剪贴板功能。

## 部署到 GitHub Pages

建议创建名为 **`TTony2019.github.io`** 的公开仓库，对应网址为 **https://ttony2019.github.io/**。

1. 在 GitHub 创建仓库，不勾选初始化 README。
2. 在本目录执行以下命令，将文件推送至仓库：

   ```bash
   git init -b main
   git add .
   git commit -m "Create academic homepage"
   git remote add origin https://github.com/TTony2019/TTony2019.github.io.git
   git push -u origin main
   ```

3. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
4. 在 **Actions** 页面打开 `Deploy academic homepage to GitHub Pages`，点击 **Run workflow**。以后推送到 `main` 分支会自动重新部署。
5. 部署成功后，在 Pages 设置或 Actions 的部署记录中打开网址。

也支持使用其他仓库名，此时地址形如 `https://ttony2019.github.io/repository-name/`。页面使用相对资源路径，可兼容这种子目录部署。

确定实际网址后，将 `data/profile.json` 中的 `siteUrl` 设置为该网址（建议带结尾 `/`）。这会生成 canonical、社交分享网址和头像地址。未设置前不会写入假定的网址。

## 更新内容

| 文件 | 用途 |
| --- | --- |
| `data/profile.json` | 姓名、博士单位与导师、`visiting` 访学单位与导师及邮箱、当前位置、学术链接、正式网址与更新日期 |
| `data/publications.json` | 论文、作者、发表信息、分类、链接及中英文研究概述 |
| `data/projects.json` | 开源项目与中英文说明 |
| `data/contributions.json` | mathlib PR 编号、链接、中英文贡献内容、合并时间与核实来源 |
| `src/index.html` | 页面模板、个人简介及章节标题 |
| `assets/css/styles.css` | 布局、配色、响应式与打印样式 |
| `assets/js/main.js` | 语言切换、导航与引用交互 |
| `assets/images/portrait.jpg` | 个人照片 |
| `scripts/build.mjs` | 静态页面与引用文件生成器 |
| `index.html` | 已生成的页面；请通过模板和数据文件更新 |
| `publications.bib` | 已生成的全部论文引用 |

修改数据或模板后，运行（需 Node.js 20 或以上版本）：

```bash
npm run build
```

再刷新浏览器即可。推送至 GitHub 后，Actions 也会根据最新模板和数据重新生成页面。

新增论文时，在 `data/publications.json` 中复制一个现有条目，设置唯一 `id`，并更新标题、作者、年份、日期和链接。`kind` 支持 `journal`、`conference`、`workshop`、`preprint`。页面依次分为 **Preprints → Conference papers → Journal papers**，每组内按 `date` 倒序排列；`workshop` 归入会议论文组，发表信息中保留 Workshop 标识。可选字段包括 `pdf`、`code`、`arxiv`、`doi`、`pages`。BibTeX 会自动生成。

为生成仅含发布文件的目录，可运行：

```bash
node scripts/build.mjs --out-dir _site
```

`_site/` 包含页面、静态资源、BibTeX 与 `.nojekyll`，可上传到其他静态网站托管服务。

mathlib 模块列出 [#41486](https://github.com/leanprover-community/mathlib4/pull/41486)、[#38551](https://github.com/leanprover-community/mathlib4/pull/38551)、[#38275](https://github.com/leanprover-community/mathlib4/pull/38275)，按合并时间倒序展示。三个 PR 的作者均为 `TTony2019`，合并状态已于 2026 年 10 月 29 日通过 `mathlib-bors[bot]` 的成功合并评论核实；相应评论链接保存在 `data/contributions.json` 的 `source` 字段。Bors 合并的 PR 在 GitHub API 中可能显示 `merged: false`，维护时请结合机器人的合并记录判断。

## 内容来源

初始内容核对于 **2026 年 10 月 28 日**，不会在访问时自动抓取第三方网站：

- [Google Scholar](https://scholar.google.com/citations?user=KpLe5t8AAAAJ&hl=en)：论文列表、作者与发表信息。
- [GitHub](https://github.com/TTony2019)：公开个人资料、邮箱、单位与项目。
- arXiv：[VeriScale](https://arxiv.org/abs/2605.22368)、[DSR](https://arxiv.org/abs/2604.19000)、[不动点算法形式化](https://arxiv.org/abs/2602.17064)、[AdaDROPS](https://arxiv.org/abs/2601.20697)。
- [Science China Mathematics](https://doi.org/10.1007/s11425-025-2516-2)：分块结构优化算法形式化论文。
- 博士生身份及导师 Jingwei Liang、目前在 University of Warwick 作为 visiting student（导师 Clarice Poon），以及交大与华威两个邮箱，均由本人确认。

尚未核实的教育经历、奖励、任职与 CV 没有加入页面。BibTeX 根据当前核实的元数据生成；已接收论文如有正式卷期页码，可在发表后补充。

头像来自本人公开的 Google Scholar 资料。标题采用 Libre Baskerville，正文采用 DM Sans，标识等细节使用 Instrument Serif。字体均使用 SIL Open Font License，相应许可文件位于 `assets/fonts/`。
