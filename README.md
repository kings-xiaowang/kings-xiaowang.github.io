# 🐾 kings小wang的个人博客

一个毛茸茸风格的个人博客系统，纯前端实现，数据存储在浏览器 IndexedDB 中。

## ✨ 特性

- 🎨 **毛茸茸风格**：焦糖色系 + 柔软阴影 + 圆润可爱的界面
- 📝 **Markdown 编辑**：支持标题、列表、引用、代码块、链接、图片等
- 🖼️ **图片上传**：支持图片自动压缩（最大 1200px），附件最大 50MB
- 💾 **IndexedDB 存储**：大容量本地存储，支持几百 MB ~ 几 GB
- 🌐 **远程数据源**：可配置 GitHub Gist 等公开 JSON 作为远程数据源
- 📱 **响应式设计**：适配桌面和移动端
- 🔐 **管理后台**：内置文章管理、数据管理、数据源设置

## 🚀 部署到 GitHub Pages

### 方法一：使用 `username.github.io` 仓库

1. 在 GitHub 创建一个新仓库，命名为 **`你的用户名.github.io`**
   - 例如你的用户名是 `foxiepaws`，就创建 `foxiepaws.github.io`
2. 把解压后的所有文件（index.html、src/ 目录、README.md 等）上传到仓库根目录
3. 提交到 main 分支
4. 等待 1-2 分钟，GitHub Pages 会自动部署
5. 在浏览器访问 `https://你的用户名.github.io` 即可

### 方法二：使用普通仓库

1. 创建任意名字的仓库，比如 `pawblog`
2. 把解压后的文件上传到仓库根目录
3. 进入仓库的 **Settings** → **Pages**
4. Source 选择 `Deploy from a branch`，Branch 选择 `main` / `root`，点击 Save
5. 等待 1-2 分钟，访问地址为 `https://你的用户名.github.io/pawblog/`
   - （路径里的仓库名和你创建的一致）

## 🔑 管理后台

- **入口**：网站右上角的爪印图标，或直接访问 `#/admin`
- **默认账号**：`admin` / `admin123`
- 首次登录后建议修改默认密码（可以在 IndexedDB 控制台改，或以后的版本支持前台修改）

## 🌐 配置远程数据源

博客默认把文章存在访客自己浏览器的 IndexedDB 里，每个访客看到的内容是独立的。
如果想让所有访客看到同样的文章，需要配置远程数据源：

1. 在管理后台 → **数据管理** → 点击「导出数据（远程格式）」，下载 JSON 文件
2. 把这个 JSON 文件上传到 GitHub Gist：https://gist.github.com
   - 文件名建议叫 `blog-data.json`
3. 创建成功后，点击「Raw」按钮，复制地址栏的链接
   - 链接格式类似：`https://gist.githubusercontent.com/你的用户名/xxx/raw/blog-data.json`
4. 回到管理后台 → **数据源设置**，把链接粘贴进去，点击「保存设置」
5. 点击「立即同步」测试是否成功
6. 之后其他访客访问你的博客网站时，就会自动从远程 Gist 加载文章数据

**更新文章的工作流：**
本地写文章 → 导出远程格式 JSON → 上传到 Gist → 访客自动看到最新内容

## 📂 项目结构

```
pawblog/
├── index.html              # 主入口
├── README.md               # 说明文档
└── src/
    └── blog/
        ├── blog-styles.css         # 样式
        ├── blog-error-handler.js   # 全局错误捕获
        ├── blog-db-indexeddb.js    # IndexedDB 数据层
        ├── blog-remote.js          # 远程数据源
        ├── blog-utils.js           # 工具函数（Markdown、Toast 等）
        ├── blog-icons.jsx          # SVG 图标组件
        ├── BlogApp.jsx             # 主应用 + 路由
        └── pages/
            ├── BlogHome.jsx        # 首页
            ├── BlogPost.jsx        # 文章详情
            ├── BlogAbout.jsx       # 关于页
            ├── BlogPostEditor.jsx  # 文章编辑器
            └── BlogAdmin.jsx       # 管理后台
```

## 💡 说明

- 本博客使用 Babel standalone 在浏览器端实时编译 JSX，无需构建工具
- React、ReactDOM、Babel 通过 CDN 加载，首次访问需要联网
- 所有数据（文章、图片、设置）默认存储在浏览器本地 IndexedDB
- 清除浏览器数据会删除所有本地内容，建议定期导出备份
- 配置远程数据源后，文章内容从远程加载，图片和附件也内嵌在远程 JSON 中

## Made with 🐾

kings小wang的个人博客
