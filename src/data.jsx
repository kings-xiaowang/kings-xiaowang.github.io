// 项目数据
const PROJECTS_DATA = [
  {
    id: 'furry-ui-kit',
    name: 'furry-ui-kit',
    icon: 'paw',
    desc: '一套毛茸茸风格的 React UI 组件库，让你的网站立刻变得软乎乎的。包含按钮、卡片、输入框等 30+ 组件。',
    language: 'TypeScript',
    langColor: '#3178C6',
    stars: 328,
    forks: 45,
    visibility: '开源',
    updated: '2 天前',
    topics: ['react', 'ui', 'components', 'furry'],
    featured: true,
    readme: `
## 🐾 Furry UI Kit

一套毛茸茸风格的 React 组件库，让你的网站立刻变得软乎乎、暖融融。

### ✨ 特性

- **30+ 组件**：从按钮到模态框，应有尽有
- **TypeScript 支持**：完整的类型定义
- **主题定制**：通过 CSS 变量轻松换肤
- **无障碍友好**：遵循 WAI-ARIA 规范
- **轻量**：gzip 后仅 12KB

### 🚀 快速开始

\`\`\`bash
npm install furry-ui-kit
\`\`\`

\`\`\`tsx
import { Button, Card } from 'furry-ui-kit';
import 'furry-ui-kit/dist/style.css';

function App() {
  return (
    <Card>
      <h2>你好，毛茸茸！</h2>
      <Button variant="fluffy">点击我 🐾</Button>
    </Card>
  );
}
\`\`\`

### 📦 组件列表

- 基础：Button, Input, Switch, Checkbox
- 布局：Card, Container, Grid, Stack
- 反馈：Toast, Modal, Tooltip, Loading
- 数据展示：Table, Tag, Avatar, Badge
- 导航：Tabs, Menu, Breadcrumb

### 🤝 参与贡献

欢迎提交 Issue 和 PR！让我们一起把更多毛茸茸带给世界 🌿
    `,
    files: [
      { name: 'src', type: 'folder', message: 'feat: 添加毛茸茸按钮组件', time: '2 天前' },
      { name: 'docs', type: 'folder', message: 'docs: 更新使用文档', time: '5 天前' },
      { name: 'tests', type: 'folder', message: 'test: 补充单元测试', time: '1 周前' },
      { name: '.gitignore', type: 'file', message: 'chore: 初始化项目', time: '3 个月前' },
      { name: 'package.json', type: 'file', message: 'v1.2.0 发布', time: '2 天前' },
      { name: 'README.md', type: 'file', message: 'docs: 新增快速开始指南', time: '3 天前' },
      { name: 'tsconfig.json', type: 'file', message: 'chore: 升级 TypeScript 5.0', time: '2 周前' },
      { name: 'vite.config.ts', type: 'file', message: 'build: 优化打包配置', time: '1 周前' },
    ]
  },
  {
    id: 'paw-tracker',
    name: 'paw-tracker',
    icon: 'tracker',
    desc: '毛茸茸习惯追踪器，用可爱的爪印记录你每天的小成就。支持多平台同步。',
    language: 'Vue',
    langColor: '#42B883',
    stars: 256,
    forks: 32,
    visibility: '开源',
    updated: '5 天前',
    topics: ['vue', 'habit-tracker', 'pwa', 'furry'],
    featured: true,
    readme: `
## 🐾 Paw Tracker

一个毛茸茸风格的习惯追踪应用，用可爱的爪印记录你每天的小成就。

### ✨ 功能

- **习惯打卡**：每天记录，集齐一周召唤惊喜
- **数据统计**：可视化你的坚持轨迹
- **PWA 支持**：离线也能用
- **多端同步**：手机电脑无缝衔接
- **自定义主题**：多种毛茸茸配色可选

### 🎨 主题

- 焦糖狐狸（默认）
- 薄荷兔兔
- 薰衣草猫猫
- 森林熊熊

### 🚀 开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
\`\`\`

### 🌟 为什么叫 Paw Tracker？

因为每坚持一天，就像在人生路上踩下一个坚实的爪印。一步一个爪印，终将抵达想去的地方！
    `,
    files: [
      { name: 'src', type: 'folder', message: 'feat: 新增森林熊熊主题', time: '5 天前' },
      { name: 'public', type: 'folder', message: 'chore: 更新图标资源', time: '2 周前' },
      { name: '.env.example', type: 'file', message: 'chore: 添加环境变量示例', time: '1 个月前' },
      { name: 'package.json', type: 'file', message: 'v0.9.0 beta 发布', time: '5 天前' },
      { name: 'README.md', type: 'file', message: 'docs: 更新功能介绍', time: '1 周前' },
      { name: 'vite.config.js', type: 'file', message: 'build: 配置 PWA 插件', time: '3 周前' },
    ]
  },
  {
    id: 'fluffy-cli',
    name: 'fluffy-cli',
    icon: 'terminal',
    desc: '命令行里的毛茸茸体验——终端输出也可以很可爱！彩色爪印进度条、emoji 状态提示。',
    language: 'Rust',
    langColor: '#DEA584',
    stars: 189,
    forks: 21,
    visibility: '开源',
    updated: '1 周前',
    topics: ['cli', 'rust', 'terminal', 'tools'],
    featured: true,
    readme: `
## 🧶 Fluffy CLI

让命令行也变得毛茸茸起来！Fluffy CLI 是一套可爱的终端工具集。

### ✨ 包含的工具

- \`fluffy-progress\` — 爪印进度条
- \`fluffy-spinner\` — 毛茸茸加载动画
- \`fluffy-table\` — 圆角软边表格
- \`fluffy-log\` — 带表情的日志输出

### 📦 安装

\`\`\`bash
cargo install fluffy-cli
\`\`\`

### 🎯 快速上手

\`\`\`rust
use fluffy_cli::ProgressBar;

fn main() {
    let mut pb = ProgressBar::new(100);
    pb.set_style("paw"); // 爪印风格！
    
    for i in 0..100 {
        pb.inc(1);
        // 做些事情...
    }
    pb.finish("完成啦！🐾");
}
\`\`\`

### 为什么用 Rust？

因为我们想要极致的性能 + 极致的可爱。毛茸茸的外表下，是硬核的性能追求。
    `,
    files: [
      { name: 'src', type: 'folder', message: 'feat: 实现爪印进度条动画', time: '1 周前' },
      { name: 'examples', type: 'folder', message: 'docs: 添加使用示例', time: '2 周前' },
      { name: 'Cargo.toml', type: 'file', message: 'v0.3.0 发布', time: '1 周前' },
      { name: 'README.md', type: 'file', message: 'docs: 完善文档', time: '1 周前' },
      { name: 'LICENSE', type: 'file', message: 'chore: 添加 MIT 许可证', time: '2 个月前' },
    ]
  },
  {
    id: 'den-messenger',
    name: 'den-messenger',
    icon: 'chat',
    desc: '毛茸茸风格的即时通讯小工具，适合兽友们聊天用。端到端加密，注重隐私。',
    language: 'Go',
    langColor: '#00ADD8',
    stars: 145,
    forks: 18,
    visibility: '开源',
    updated: '2 周前',
    topics: ['go', 'chat', 'privacy', 'messenger'],
    featured: false,
    readme: `
## 🏕️ Den Messenger

毛茸茸风格的即时通讯应用，一个属于兽友们的温暖小窝。

### ✨ 特性

- **端到端加密**：你的对话只属于你们
- **自托管**：数据掌握在自己手里
- **表情包支持**：内置毛茸茸专属表情包
- **轻量客户端**：Electron + Web 双端
- **群组功能**：最多支持 200 人群聊

### 🏗️ 架构

- 后端：Go + WebSocket
- 前端：React + TypeScript
- 数据库：SQLite
- 加密：Signal 协议

### 🚀 快速启动

\`\`\`bash
# 启动服务端
go run cmd/server/main.go

# 启动客户端
cd client && npm run dev
\`\`\`
    `,
    files: [
      { name: 'cmd', type: 'folder', message: 'feat: 服务端入口', time: '2 周前' },
      { name: 'client', type: 'folder', message: 'feat: 前端客户端', time: '3 周前' },
      { name: 'internal', type: 'folder', message: 'refactor: 重构加密模块', time: '1 周前' },
      { name: 'go.mod', type: 'file', message: 'chore: 升级依赖', time: '2 周前' },
      { name: 'README.md', type: 'file', message: 'docs: 添加架构说明', time: '3 周前' },
    ]
  },
  {
    id: 'pawprint-blog',
    name: 'pawprint-blog',
    icon: 'book',
    desc: '基于 Next.js 的个人博客系统，支持 Markdown、代码高亮和评论系统。',
    language: 'JavaScript',
    langColor: '#F7DF1E',
    stars: 98,
    forks: 15,
    visibility: '开源',
    updated: '3 周前',
    topics: ['nextjs', 'blog', 'markdown', 'ssg'],
    featured: false,
    readme: `
## 📖 PawPrint Blog

一个毛茸茸风格的个人博客系统，用爪印记录你的每一个想法。

### ✨ 功能

- **Markdown 写作**：专注于内容本身
- **代码高亮**：Shiki 驱动的语法高亮
- **评论系统**：基于 Giscus
- **RSS 订阅**：方便读者关注
- **暗黑模式**：毛茸茸的夜晚配色
- **SEO 优化**：开箱即用

### 🛠️ 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- MDX
- Shiki

### 🚀 开始写作

\`\`\`bash
# 克隆模板
npx create-pawprint-blog my-blog

# 启动开发
cd my-blog && npm run dev
\`\`\`
    `,
    files: [
      { name: 'app', type: 'folder', message: 'feat: 文章详情页', time: '3 周前' },
      { name: 'content', type: 'folder', message: 'docs: 示例文章', time: '1 个月前' },
      { name: 'components', type: 'folder', message: 'feat: 目录组件', time: '2 周前' },
      { name: 'public', type: 'folder', message: 'chore: 静态资源', time: '1 个月前' },
      { name: 'package.json', type: 'file', message: 'v1.0.0 正式发布', time: '3 周前' },
      { name: 'next.config.js', type: 'file', message: 'build: 配置 MDX', time: '1 个月前' },
    ]
  },
  {
    id: 'furry-avatar-maker',
    name: 'furry-avatar-maker',
    icon: 'art',
    desc: '在线制作毛茸茸兽设头像的工具，几百种组合，几分钟生成你的专属形象。',
    language: 'TypeScript',
    langColor: '#3178C6',
    stars: 412,
    forks: 67,
    visibility: '开源',
    updated: '1 天前',
    topics: ['canvas', 'avatar', 'generator', 'furry'],
    featured: true,
    readme: `
## 🎨 Furry Avatar Maker

在线制作毛茸茸兽设头像的工具，几百种组合，几分钟生成你的专属形象。

### ✨ 功能

- **物种选择**：狐狸、狼、猫、龙、兔子... 还在持续增加
- **配色定制**：毛色、花纹、眼睛颜色自由搭配
- **服饰配件**：帽子、眼镜、围巾、耳机
- **实时预览**：所见即所得
- **导出 PNG/SVG**：高清无损

### 🎯 使用方式

直接访问 [在线版本](https://example.com/avatar-maker) 即可使用，无需安装。

### 🏗️ 本地开发

\`\`\`bash
git clone https://github.com/yourname/furry-avatar-maker.git
cd furry-avatar-maker
npm install
npm run dev
\`\`\`

### 🌟 Star 历史

这个项目从一个周末玩具成长为有 400+ star 的小工具，感谢每一位使用者的支持！
    `,
    files: [
      { name: 'src', type: 'folder', message: 'feat: 新增龙族物种模板', time: '1 天前' },
      { name: 'assets', type: 'folder', message: 'feat: 添加新的服饰配件', time: '3 天前' },
      { name: 'public', type: 'folder', message: 'chore: 更新 favicon', time: '1 周前' },
      { name: 'package.json', type: 'file', message: 'v2.1.0 发布 🐉', time: '1 天前' },
      { name: 'README.md', type: 'file', message: 'docs: 添加使用截图', time: '5 天前' },
      { name: 'vite.config.ts', type: 'file', message: 'build: 优化打包体积', time: '2 周前' },
    ]
  },
  {
    id: 'cozy-vscode-theme',
    name: 'cozy-vscode-theme',
    icon: 'palette',
    desc: '毛茸茸风格的 VS Code 主题，柔和的焦糖配色，让写代码也变成一种享受。',
    language: 'JSON',
    langColor: '#292929',
    stars: 76,
    forks: 8,
    visibility: '开源',
    updated: '1 个月前',
    topics: ['vscode', 'theme', 'cozy', 'dark-theme'],
    featured: false,
    readme: `
## 🌙 Cozy VS Code Theme

毛茸茸风格的 VS Code 主题，柔和的焦糖配色，让写代码也变成一种享受。

### ✨ 特色

- **柔和低对比度**：长时间编码也不累眼
- **温暖焦糖色调**：像一杯热可可般治愈
- **精心调配的语法高亮**：每种语言都认真调试过
- **支持 Ligature**：配合 Fira Code 食用更佳

### 📦 安装

1. 打开 VS Code
2. 搜索 "Cozy Furry Theme"
3. 点击安装
4. 选择 "Cozy Furry Dark" 或 "Cozy Furry Light"

### 🎨 调色板

- 背景：#2A1F14 (深焦糖)
- 前景：#E8D8C4 (奶油白)
- 强调色：#D18F4F (焦糖金)
- 字符串：#9B8AA6 (柔雾紫)
- 函数：#5A9B6A (森林绿)
    `,
    files: [
      { name: 'themes', type: 'folder', message: 'feat: 浅色主题版本', time: '1 个月前' },
      { name: 'images', type: 'folder', message: 'docs: 添加预览截图', time: '1 个月前' },
      { name: 'package.json', type: 'file', message: 'v0.5.0 发布', time: '1 个月前' },
      { name: 'README.md', type: 'file', message: 'docs: 安装说明', time: '1 个月前' },
      { name: 'CHANGELOG.md', type: 'file', message: 'docs: 更新日志', time: '1 个月前' },
    ]
  },
  {
    id: 'nestbox-api',
    name: 'nestbox-api',
    icon: 'server',
    desc: '一个简洁的后端 API 框架，像鸟巢一样温暖可靠。支持自动文档生成和类型安全。',
    language: 'Python',
    langColor: '#3776AB',
    stars: 134,
    forks: 22,
    visibility: '开源',
    updated: '4 天前',
    topics: ['python', 'api', 'fastapi', 'backend'],
    featured: false,
    readme: `
## 🪺 NestBox API

一个简洁的 Python 后端 API 框架，像鸟巢一样温暖可靠。

### ✨ 特性

- **类型安全**：基于 Pydantic 的数据校验
- **自动文档**：Swagger UI 自动生成
- **异步支持**：async/await 原生支持
- **依赖注入**：简洁优雅的 DI 系统
- **中间件**：灵活的扩展机制

### 🚀 快速开始

\`\`\`python
from nestbox import NestBox, Route

app = NestBox()

@app.get("/")
async def hello():
    return {"message": "欢迎来到鸟巢！🪺"}

if __name__ == "__main__":
    app.run()
\`\`\`

### 📦 安装

\`\`\`bash
pip install nestbox-api
\`\`\`
    `,
    files: [
      { name: 'nestbox', type: 'folder', message: 'feat: WebSocket 支持', time: '4 天前' },
      { name: 'examples', type: 'folder', message: 'docs: 使用示例', time: '1 周前' },
      { name: 'tests', type: 'folder', message: 'test: 集成测试', time: '3 天前' },
      { name: 'pyproject.toml', type: 'file', message: 'v0.8.0 发布', time: '4 天前' },
      { name: 'README.md', type: 'file', message: 'docs: 快速上手指南', time: '1 周前' },
    ]
  },
];

// 用户信息
const USER_PROFILE = {
  name: '毛茸茸的小狐狸',
  handle: 'foxiepaws',
  avatar: '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu2lt5gci_ve_miaoda',
  bio: '一只热爱开源的小狐狸 🦊 喜欢用毛茸茸的方式写代码。前端工程师，业余时间做一些 furry 相关的小工具。欢迎来一起玩！',
  location: '森林小屋',
  blog: 'foxiepaws.dev',
  joined: '2021 年 3 月加入',
  repos: 12,
  stars: 1638,
  followers: 892,
  following: 45,
};

// 生成贡献图数据（模拟）
function generateContributionData() {
  const weeks = 52;
  const days = 7;
  const data = [];
  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < days; d++) {
      const rand = Math.random();
      let level = 0;
      if (rand > 0.7) level = 1;
      if (rand > 0.85) level = 2;
      if (rand > 0.93) level = 3;
      if (rand > 0.98) level = 4;
      // 周末少一点
      if (d >= 5) level = Math.max(0, level - 1);
      week.push(level);
    }
    data.push(week);
  }
  return data;
}

const CONTRIBUTION_DATA = generateContributionData();

// 暴露到全局
Object.assign(window, {
  PROJECTS_DATA,
  USER_PROFILE,
  CONTRIBUTION_DATA,
});
