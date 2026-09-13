// 简单的 JSON 文件数据库，零依赖
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// 确保数据目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const FOX_AVATAR = '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu7li7ydq_ve_miaoda';
const WOLF_AVATAR = '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4tqfaho_ve_miaoda';
const RABBIT_AVATAR = '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu7li72iq_ve_miaoda';
const BEAR_AVATAR = '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4lbaqji_ve_miaoda';
const CAT_AVATAR = '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4tqfcao_ve_miaoda';
const DRAGON_AVATAR = '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4zoicdg_ve_miaoda';

// 默认数据结构
const DEFAULT_DB = {
  users: [
    {
      id: 1,
      username: 'foxiepaws',
      email: 'foxie@example.com',
      passwordHash: '', // 由初始化时设置
      avatar: FOX_AVATAR,
      bio: '一只热爱开源的小狐狸 🦊 喜欢用毛茸茸的方式写代码。前端工程师，业余时间做一些 furry 相关的小工具。欢迎来一起玩！',
      location: '森林小屋',
      blog: 'foxiepaws.dev',
      createdAt: '2021-03-15T00:00:00.000Z',
    },
    {
      id: 2,
      username: 'wolfdev',
      email: 'wolf@example.com',
      passwordHash: 'pbkdf2$100000$demo$demo',
      avatar: WOLF_AVATAR,
      bio: '后端开发工程师，喜欢系统架构和性能优化。狼的直觉很准 🌙',
      location: '月光山谷',
      blog: 'wolfdev.tech',
      createdAt: '2022-01-20T00:00:00.000Z',
    },
    {
      id: 3,
      username: 'bunnycode',
      email: 'bunny@example.com',
      passwordHash: 'pbkdf2$100000$demo$demo',
      avatar: RABBIT_AVATAR,
      bio: 'UI/UX 设计师 + 前端开发，热衷于创造美好的用户体验 🐰',
      location: '花田小镇',
      blog: 'bunnyui.design',
      createdAt: '2022-06-10T00:00:00.000Z',
    },
    {
      id: 4,
      username: 'bearhacker',
      email: 'bear@example.com',
      passwordHash: 'pbkdf2$100000$demo$demo',
      avatar: BEAR_AVATAR,
      bio: '全栈工程师，啥都能写。冬天会冬眠，代码也会打盹 🐻',
      location: '蜂蜜洞穴',
      blog: '',
      createdAt: '2020-11-05T00:00:00.000Z',
    },
    {
      id: 5,
      username: 'meowking',
      email: 'meow@example.com',
      passwordHash: 'pbkdf2$100000$demo$demo',
      avatar: CAT_AVATAR,
      bio: '独立开发者，做自己喜欢的产品。猫的优雅，工程师的严谨 🐱',
      location: '星空塔',
      blog: 'meowking.dev',
      createdAt: '2019-08-18T00:00:00.000Z',
    },
    {
      id: 6,
      username: 'dragonguy',
      email: 'dragon@example.com',
      passwordHash: 'pbkdf2$100000$demo$demo',
      avatar: DRAGON_AVATAR,
      bio: '游戏开发爱好者，喜欢一切闪闪发光的东西 🐉',
      location: '宝石山洞',
      blog: '',
      createdAt: '2023-02-14T00:00:00.000Z',
    },
  ],
  projects: [
    {
      id: 1,
      slug: 'furry-ui-kit',
      name: 'furry-ui-kit',
      icon: 'paw',
      desc: '一套毛茸茸风格的 React UI 组件库，让你的网站立刻变得软乎乎的。包含按钮、卡片、输入框等 30+ 组件。',
      language: 'TypeScript',
      langColor: '#3178C6',
      visibility: '开源',
      topics: ['react', 'ui', 'components', 'furry'],
      featured: true,
      readme: `## 🐾 Furry UI Kit

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

### 📦 组件列表

基础：Button, Input, Switch, Checkbox
布局：Card, Container, Grid, Stack
反馈：Toast, Modal, Tooltip, Loading
数据展示：Table, Tag, Avatar, Badge
导航：Tabs, Menu, Breadcrumb`,
      files: [],
      ownerId: 1,
      createdAt: '2023-06-10T00:00:00.000Z',
      updatedAt: '2026-09-10T00:00:00.000Z',
    },
    {
      id: 2,
      slug: 'paw-tracker',
      name: 'paw-tracker',
      icon: 'tracker',
      desc: '毛茸茸习惯追踪器，用可爱的爪印记录你每天的小成就。支持多平台同步。',
      language: 'Vue',
      langColor: '#42B883',
      visibility: '开源',
      topics: ['vue', 'habit-tracker', 'pwa', 'furry'],
      featured: true,
      readme: `## 🐾 Paw Tracker

一个毛茸茸风格的习惯追踪应用，用可爱的爪印记录你每天的小成就。

### ✨ 功能

- **习惯打卡**：每天记录，集齐一周召唤惊喜
- **数据统计**：可视化你的坚持轨迹
- **PWA 支持**：离线也能用
- **多端同步**：手机电脑无缝衔接
- **自定义主题**：多种毛茸茸配色可选

### 🎨 主题

- 焦糖狐狸（默认）
- 薄荷猫
- 奶油兔兔
- 蓝莓龙`,
      files: [],
      ownerId: 2,
      createdAt: '2023-08-22T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
    },
    {
      id: 3,
      slug: 'fluffy-cli',
      name: 'fluffy-cli',
      icon: 'terminal',
      desc: '让命令行变得毛茸茸的工具集，内置丰富的主题和动画效果。',
      language: 'Rust',
      langColor: '#DEA584',
      visibility: '开源',
      topics: ['cli', 'rust', 'terminal', 'tools'],
      featured: true,
      readme: `## 🧶 Fluffy CLI

让命令行变得毛茸茸的工具集。

### 特性

- 20+ 毛茸茸终端主题
- 动画效果：打字机、渐变、彩虹光标
- 内置常用命令别名
- 跨平台支持`,
      files: [],
      ownerId: 4,
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2026-09-05T00:00:00.000Z',
    },
    {
      id: 4,
      slug: 'den-messenger',
      name: 'den-messenger',
      icon: 'chat',
      desc: '毛茸茸风格的即时通讯工具，支持群聊、文件传输、表情贴纸。',
      language: 'JavaScript',
      langColor: '#F1E05A',
      visibility: '开源',
      topics: ['chat', 'messaging', 'real-time', 'furry'],
      featured: false,
      readme: `## 🏠 Den Messenger

毛茸茸风格的即时通讯工具。

### 功能

- 一对一私聊和群聊
- 文件传输
- 毛茸茸表情包
- 端到端加密
- 多设备同步`,
      files: [],
      ownerId: 2,
      createdAt: '2024-03-20T00:00:00.000Z',
      updatedAt: '2026-08-28T00:00:00.000Z',
    },
    {
      id: 5,
      slug: 'pawprint-blog',
      name: 'pawprint-blog',
      icon: 'book',
      desc: '基于 Node.js 的轻量级博客系统，毛茸茸主题，Markdown 写作。',
      language: 'JavaScript',
      langColor: '#F1E05A',
      visibility: '开源',
      topics: ['blog', 'nodejs', 'markdown', 'ssr'],
      featured: false,
      readme: `## 🐾 Pawprint Blog

基于 Node.js 的轻量级博客系统。

### 特性

- Markdown 写作
- 毛茸茸主题
- 评论系统
- RSS 订阅
- SEO 优化`,
      files: [],
      ownerId: 1,
      createdAt: '2024-05-10T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 6,
      slug: 'furry-avatar-maker',
      name: 'furry-avatar-maker',
      icon: 'art',
      desc: '在线生成定制化的 furry 头像，多种种族、发型、配饰可选。',
      language: 'TypeScript',
      langColor: '#3178C6',
      visibility: '开源',
      topics: ['avatar', 'canvas', 'generator', 'furry'],
      featured: true,
      readme: `## 🎨 Furry Avatar Maker

在线生成定制化的 furry 头像。

### 功能

- 多种种族选择：狐狸、狼、兔子、龙...
- 发型、配饰、服装自定义
- 颜色调整
- PNG / SVG 导出
- 分享链接`,
      files: [],
      ownerId: 3,
      createdAt: '2024-07-01T00:00:00.000Z',
      updatedAt: '2026-09-09T00:00:00.000Z',
    },
    {
      id: 7,
      slug: 'cozy-vscode-theme',
      name: 'cozy-vscode-theme',
      icon: 'palette',
      desc: 'VS Code 毛茸茸主题配色，柔和的色彩让编码更舒适。',
      language: 'JSON',
      langColor: '#292929',
      visibility: '开源',
      topics: ['vscode', 'theme', 'color-scheme', 'cozy'],
      featured: false,
      readme: `## 🌙 Cozy VSCode Theme

VS Code 毛茸茸主题配色。

### 配色特点

- 柔和低对比度，护眼
- 焦糖色基调
- 适合长时间编码
- 亮色和暗色双版本`,
      files: [],
      ownerId: 5,
      createdAt: '2024-09-15T00:00:00.000Z',
      updatedAt: '2026-08-20T00:00:00.000Z',
    },
    {
      id: 8,
      slug: 'nestbox-api',
      name: 'nestbox-api',
      icon: 'server',
      desc: '快速搭建 RESTful API 的 Node.js 框架，约定大于配置。',
      language: 'TypeScript',
      langColor: '#3178C6',
      visibility: '开源',
      topics: ['api', 'nodejs', 'framework', 'backend'],
      featured: false,
      readme: `## 📦 NestBox API

快速搭建 RESTful API 的 Node.js 框架。

### 特性

- 约定大于配置
- 自动路由生成
- 内置验证
- 中间件系统
- 数据库适配层`,
      files: [],
      ownerId: 5,
      createdAt: '2025-02-28T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z',
    },
  ],
  stars: [
    { id: 1, userId: 2, projectId: 1, createdAt: '2026-01-10T00:00:00.000Z' },
    { id: 2, userId: 3, projectId: 1, createdAt: '2026-02-15T00:00:00.000Z' },
    { id: 3, userId: 4, projectId: 1, createdAt: '2026-03-20T00:00:00.000Z' },
    { id: 4, userId: 5, projectId: 1, createdAt: '2026-04-05T00:00:00.000Z' },
    { id: 5, userId: 6, projectId: 1, createdAt: '2026-05-12T00:00:00.000Z' },
    { id: 6, userId: 1, projectId: 2, createdAt: '2026-02-01T00:00:00.000Z' },
    { id: 7, userId: 3, projectId: 2, createdAt: '2026-03-10T00:00:00.000Z' },
    { id: 8, userId: 5, projectId: 2, createdAt: '2026-04-18T00:00:00.000Z' },
    { id: 9, userId: 1, projectId: 3, createdAt: '2026-03-05T00:00:00.000Z' },
    { id: 10, userId: 2, projectId: 3, createdAt: '2026-04-10T00:00:00.000Z' },
    { id: 11, userId: 3, projectId: 6, createdAt: '2026-05-15T00:00:00.000Z' },
    { id: 12, userId: 1, projectId: 6, createdAt: '2026-06-01T00:00:00.000Z' },
    { id: 13, userId: 4, projectId: 5, createdAt: '2026-06-20T00:00:00.000Z' },
  ],
  comments: [
    { id: 1, projectId: 1, userId: 2, content: '这个组件库太可爱了！已经用在我的个人项目上了 🎉', createdAt: '2026-09-08T10:30:00.000Z' },
    { id: 2, projectId: 1, userId: 3, content: '希望能出更多毛茸茸风格的组件～加油！', createdAt: '2026-09-09T14:20:00.000Z' },
    { id: 3, projectId: 1, userId: 6, content: 'TypeScript 支持很完善，文档也很清晰 👍', createdAt: '2026-09-10T09:15:00.000Z' },
    { id: 4, projectId: 2, userId: 1, content: 'PWA 功能太赞了，手机上用起来很方便！', createdAt: '2026-09-05T16:00:00.000Z' },
    { id: 5, projectId: 6, userId: 1, content: '我做出了一只超级可爱的狐狸头像！太好玩了 🦊', createdAt: '2026-09-07T11:00:00.000Z' },
    { id: 6, projectId: 3, userId: 5, content: 'Rust 写的 CLI 性能真的不错，主题也很好看', createdAt: '2026-09-06T08:45:00.000Z' },
  ],
  follows: [
    { id: 1, followerId: 2, followingId: 1, createdAt: '2026-01-05T00:00:00.000Z' },
    { id: 2, followerId: 3, followingId: 1, createdAt: '2026-02-10T00:00:00.000Z' },
    { id: 3, followerId: 4, followingId: 1, createdAt: '2026-03-15T00:00:00.000Z' },
    { id: 4, followerId: 5, followingId: 1, createdAt: '2026-04-20T00:00:00.000Z' },
    { id: 5, followerId: 6, followingId: 1, createdAt: '2026-05-25T00:00:00.000Z' },
    { id: 6, followerId: 1, followingId: 2, createdAt: '2026-02-01T00:00:00.000Z' },
    { id: 7, followerId: 1, followingId: 3, createdAt: '2026-03-01T00:00:00.000Z' },
    { id: 8, followerId: 3, followingId: 2, createdAt: '2026-03-10T00:00:00.000Z' },
    { id: 9, followerId: 4, followingId: 5, createdAt: '2026-04-15T00:00:00.000Z' },
    { id: 10, followerId: 2, followingId: 5, createdAt: '2026-05-10T00:00:00.000Z' },
    { id: 11, followerId: 6, followingId: 3, createdAt: '2026-06-01T00:00:00.000Z' },
    { id: 12, followerId: 5, followingId: 3, createdAt: '2026-06-15T00:00:00.000Z' },
  ],
  sessions: [
    // { sid, userId, expiresAt }
  ],
  _seq: { users: 7, projects: 9, stars: 14, comments: 7, follows: 13 }
};

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    saveDB(DEFAULT_DB);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    // 确保新表存在（向后兼容）
    if (!data.comments) data.comments = [];
    if (!data.follows) data.follows = [];
    if (!data._seq) data._seq = { users: 2, projects: 1, stars: 1, comments: 1, follows: 1 };
    if (!data._seq.comments) data._seq.comments = 1;
    if (!data._seq.follows) data._seq.follows = 1;
    if (!data.projects) data.projects = [];
    return data;
  } catch (e) {
    console.error('数据库读取失败，使用默认数据：', e.message);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function saveDB(db) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
}

// 生成下一个 ID
function nextId(db, table) {
  db._seq[table] = (db._seq[table] || 1) + 1;
  return db._seq[table];
}

export const DB = {
  get: loadDB,
  save: saveDB,
  nextId,
};
