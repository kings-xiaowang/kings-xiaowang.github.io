// PawBlog 网站源码导出模块
// 轻量级 ZIP 生成器（无需外部库），导出完整网站源码供部署到 GitHub Pages

const PawExport = (function () {
  // ========== 简化版 ZIP 生成器 ==========
  // 仅支持 STORE 方式（不压缩），文件名用 UTF-8
  function crc32(str) {
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function crc32Bytes(bytes) {
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  // 字符串转 UTF-8 字节
  function strToUtf8Bytes(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  // 生成 ZIP 文件
  function createZip(files) {
    // files: [{ name: string, content: string (utf-8 text) | Uint8Array }]
    const entries = [];
    let centralDir = [];
    let offset = 0;

    for (const file of files) {
      const nameBytes = strToUtf8Bytes(file.name);
      let contentBytes;
      if (file.content instanceof Uint8Array) {
        contentBytes = file.content;
      } else {
        contentBytes = strToUtf8Bytes(file.content || '');
      }

      const crc = crc32Bytes(contentBytes);
      const size = contentBytes.length;

      // Local file header
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(localHeader.buffer);
      view.setUint32(0, 0x04034b50, true); // signature
      view.setUint16(4, 20, true); // version needed
      view.setUint16(6, 0x0800, true); // general purpose flag (UTF-8)
      view.setUint16(8, 0, true); // compression method (store)
      view.setUint16(10, 0, true); // last mod time
      view.setUint16(12, 0, true); // last mod date
      view.setUint32(14, crc, true); // crc-32
      view.setUint32(18, size, true); // compressed size
      view.setUint32(22, size, true); // uncompressed size
      view.setUint16(26, nameBytes.length, true); // file name length
      view.setUint16(28, 0, true); // extra field length
      localHeader.set(nameBytes, 30);

      const entrySize = localHeader.length + contentBytes.length;
      entries.push(localHeader, contentBytes);

      // Central directory entry
      const centEntry = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centEntry.buffer);
      cv.setUint32(0, 0x02014b50, true); // signature
      cv.setUint16(4, 20, true); // version made by
      cv.setUint16(6, 20, true); // version needed
      cv.setUint16(8, 0x0800, true); // flags (UTF-8)
      cv.setUint16(10, 0, true); // compression
      cv.setUint16(12, 0, true); // mod time
      cv.setUint16(14, 0, true); // mod date
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true); // compressed
      cv.setUint32(24, size, true); // uncompressed
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true); // extra
      cv.setUint16(32, 0, true); // comment
      cv.setUint16(34, 0, true); // disk number start
      cv.setUint16(36, 0, true); // internal attrs
      cv.setUint32(38, 0, true); // external attrs
      cv.setUint32(42, offset, true); // relative offset
      centEntry.set(nameBytes, 46);

      centralDir.push(centEntry);
      offset += entrySize;
    }

    // 合并所有 entry
    let totalSize = offset;
    let centralSize = 0;
    for (const c of centralDir) centralSize += c.length;

    const zip = new Uint8Array(totalSize + centralSize + 22);
    let pos = 0;
    for (const entry of entries) {
      zip.set(entry, pos);
      pos += entry.length;
    }
    const centralOffset = pos;
    for (const c of centralDir) {
      zip.set(c, pos);
      pos += c.length;
    }

    // End of central directory
    const endView = new DataView(zip.buffer, pos, 22);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true); // disk number
    endView.setUint16(6, 0, true); // disk with start of central dir
    endView.setUint16(8, centralDir.length, true); // entries on this disk
    endView.setUint16(10, centralDir.length, true); // total entries
    endView.setUint32(12, centralSize, true); // size of central dir
    endView.setUint32(16, centralOffset, true); // offset
    endView.setUint16(20, 0, true); // comment length

    return zip;
  }

  // ========== 收集网站文件 ==========
  async function collectSiteFiles() {
    const files = [];

    // 1. 生成 index.html（使用 Babel standalone 运行时编译）
    const indexHtml = buildIndexHtml();
    files.push({ name: 'index.html', content: indexHtml });

    // 2. 所有 JS / JSX / CSS 文件（从 src 目录读取）
    const srcPaths = [
      'src/blog/blog-styles.css',
      'src/blog/blog-error-handler.js',
      'src/blog/blog-db-indexeddb.js',
      'src/blog/blog-remote.js',
      'src/blog/blog-utils.js',
      'src/blog/blog-icons.jsx',
      'src/blog/BlogApp.jsx',
      'src/blog/blog-export.js',
      'src/blog/pages/BlogHome.jsx',
      'src/blog/pages/BlogPost.jsx',
      'src/blog/pages/BlogAbout.jsx',
      'src/blog/pages/BlogPostEditor.jsx',
      'src/blog/pages/BlogAdmin.jsx',
    ];

    for (const path of srcPaths) {
      try {
        const resp = await fetch(path, { cache: 'no-store' });
        if (resp.ok) {
          const text = await resp.text();
          files.push({ name: path, content: text });
        } else {
          console.warn('[PawExport] 源文件读取失败:', path, resp.status);
        }
      } catch (e) {
        console.warn('[PawExport] 源文件读取出错:', path, e.message);
      }
    }

    // 3. README.md
    const readme = generateReadme();
    files.push({ name: 'README.md', content: readme });

    return files;
  }

  // 构建 index.html（使用 Babel standalone，与项目本地一致）
  function buildIndexHtml() {
    const faviconDataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23B8743F'%3E%3Cellipse cx='12' cy='16' rx='5' ry='4'/%3E%3Cellipse cx='6' cy='11' rx='2.5' ry='3'/%3E%3Cellipse cx='18' cy='11' rx='2.5' ry='3'/%3E%3Cellipse cx='9' cy='7' rx='2' ry='2.5'/%3E%3Cellipse cx='15' cy='7' rx='2' ry='2.5'/%3E%3C/svg%3E";
    const fontCss = 'https://miaoda.feishu.cn/fonts/css2?family=Fredoka:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    const reactCdn = 'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/miaoda/coding-unpkg-sdk/react@18.3.1/umd/react.production.min.js';
    const reactDomCdn = 'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/miaoda/coding-unpkg-sdk/react-dom@18.3.1/umd/react-dom.production.min.js';
    const babelCdn = 'https://sf3-scmcdn-cn.feishucdn.com/obj/feishu-static/miaoda/coding-unpkg-sdk/@babel/standalone@7.29.0/babel.min.js';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="creative-medium" content="interactive-prototype" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>kings小wang的个人博客</title>
  <link rel="stylesheet" href="src/blog/blog-styles.css?v=2" />
  <link rel="icon" type="image/svg+xml" href="${faviconDataUri}" />
  <link rel="stylesheet" href="${fontCss}" />
</head>
<body>
  <div id="root"></div>

  <script src="${reactCdn}" crossorigin="anonymous"><\/script>
  <script src="${reactDomCdn}" crossorigin="anonymous"><\/script>
  <script src="${babelCdn}" crossorigin="anonymous"><\/script>

  <!-- 全局错误捕获（最优先加载） -->
  <script src="src/blog/blog-error-handler.js?v=2"><\/script>

  <!-- 数据层（先加载，JS 直接执行） -->
  <script src="src/blog/blog-db-indexeddb.js?v=2"><\/script>
  <script src="src/blog/blog-remote.js?v=2"><\/script>
  <script src="src/blog/blog-export.js?v=2"><\/script>
  <script src="src/blog/blog-utils.js?v=2"><\/script>

  <!-- 图标组件 -->
  <script type="text/babel" src="src/blog/blog-icons.jsx?v=2"><\/script>

  <!-- 页面组件 -->
  <script type="text/babel" src="src/blog/pages/BlogHome.jsx?v=2"><\/script>
  <script type="text/babel" src="src/blog/pages/BlogPost.jsx?v=2"><\/script>
  <script type="text/babel" src="src/blog/pages/BlogAbout.jsx?v=2"><\/script>
  <script type="text/babel" src="src/blog/pages/BlogPostEditor.jsx?v=2"><\/script>
  <script type="text/babel" src="src/blog/pages/BlogAdmin.jsx?v=2"><\/script>

  <!-- 主应用（最后加载） -->
  <script type="text/babel" src="src/blog/BlogApp.jsx?v=2"><\/script>
</body>
</html>`;
  }

  function generateReadme() {
    return `# 🐾 kings小wang的个人博客

一个毛茸茸风格的个人博客系统，纯前端实现，数据存储在浏览器 IndexedDB 中。

## ✨ 特性

- 🎨 **毛茸茸风格**：焦糖色系 + 柔软阴影 + 圆润可爱的界面
- 📝 **Markdown 编辑**：支持标题、列表、引用、代码块、链接、图片等
- 🖼️ **图片上传**：支持图片自动压缩（最大 1200px），附件最大 50MB
- 💾 **IndexedDB 存储**：大容量本地存储，支持几百 MB ~ 几 GB
- 🌐 **远程数据源**：内置默认 Gist 数据源，首次访问自动加载文章
- 📱 **响应式设计**：适配桌面和移动端
- 🔐 **管理后台**：内置文章管理、数据管理、数据源设置

## 🚀 部署到 GitHub Pages

### 方法一：使用 \`username.github.io\` 仓库

1. 在 GitHub 创建一个新仓库，命名为 **\`你的用户名.github.io\`**
   - 例如你的用户名是 \`foxiepaws\`，就创建 \`foxiepaws.github.io\`
2. 把解压后的所有文件（index.html、src/ 目录、README.md 等）上传到仓库根目录
3. 提交到 main 分支
4. 等待 1-2 分钟，GitHub Pages 会自动部署
5. 在浏览器访问 \`https://你的用户名.github.io\` 即可

### 方法二：使用普通仓库

1. 创建任意名字的仓库，比如 \`pawblog\`
2. 把解压后的文件上传到仓库根目录
3. 进入仓库的 **Settings** → **Pages**
4. Source 选择 \`Deploy from a branch\`，Branch 选择 \`main\` / \`root\`，点击 Save
5. 等待 1-2 分钟，访问地址为 \`https://你的用户名.github.io/pawblog/\`
   - （路径里的仓库名和你创建的一致）

## 🌐 内置默认数据源

本博客已内置默认远程数据源（GitHub Gist），部署后首次访问会自动从 Gist 加载文章数据，无需手动配置。

- 默认数据源地址：\`https://gist.githubusercontent.com/kings-xiaowang/f8e401d793ecd23ddea9b0a7b7c95585/raw/blog-data.json\`
- 如果远程加载失败，会降级显示本地示例文章
- 你可以在管理后台 → **数据源设置** 中修改为自己的 Gist 链接
- 点击「恢复默认」可以随时切回内置数据源


## 🔑 管理后台

- **入口**：网站右上角的爪印图标，或直接访问 \`#/admin\`
- **默认账号**：\`admin\` / \`admin123\`
- 首次登录后建议修改默认密码（可以在 IndexedDB 控制台改，或以后的版本支持前台修改）

## 🌐 配置自己的远程数据源

博客默认从内置的 Gist 数据源加载文章。如果你想发布自己的文章：

1. 在管理后台 → **数据管理** → 点击「导出数据（远程格式）」，下载 JSON 文件
2. 把这个 JSON 文件上传到 GitHub Gist：https://gist.github.com
   - 文件名建议叫 \`blog-data.json\`
3. 创建成功后，点击「Raw」按钮，复制地址栏的链接
   - 链接格式类似：\`https://gist.githubusercontent.com/你的用户名/xxx/raw/blog-data.json\`
4. 回到管理后台 → **数据源设置**，把链接粘贴进去，点击「保存设置」
5. 点击「立即同步」测试是否成功
6. 之后其他访客访问你的博客网站时，就会自动从远程 Gist 加载文章数据

**更新文章的工作流：**
本地写文章 → 导出远程格式 JSON → 上传到 Gist → 访客自动看到最新内容

## 📂 项目结构

\`\`\`
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
\`\`\`

## 💡 说明

- 本博客使用 Babel standalone 在浏览器端实时编译 JSX，无需构建工具
- React、ReactDOM、Babel 通过 CDN 加载，首次访问需要联网（字体失败会降级到系统字体）
- 所有数据（文章、图片、设置）默认存储在浏览器本地 IndexedDB
- 清除浏览器数据会删除所有本地内容，建议定期导出备份
- 配置远程数据源后，文章内容从远程加载，图片和附件也内嵌在远程 JSON 中

## Made with 🐾

kings小wang的个人博客
`;
  }

  // ========== 导出主函数 ==========
  async function exportWebsite() {
    const files = await collectSiteFiles();
    const zipBytes = createZip(files);

    // 生成下载
    const blob = new Blob([zipBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pawblog-website.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { fileCount: files.length, size: zipBytes.length };
  }

  return {
    exportWebsite,
    collectSiteFiles, // 调试用
  };
})();

window.PawExport = PawExport;
