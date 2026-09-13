// PawBlog 博客数据层 - localStorage 实现
// 所有数据存储在浏览器 localStorage 中，纯前端无后端

const BLOG_STORAGE_KEYS = {
  POSTS: 'pawblog_posts',
  ADMIN: 'pawblog_admin',
  SESSION: 'pawblog_session',
  SETTINGS: 'pawblog_settings',
  FILES: 'pawblog_files',
  VERSION: 'pawblog_db_version',
};

const BLOG_DB_VERSION = 2;

// 文件存储键前缀（每个文件单独存一个 key，避免单条 JSON 过大）
const BLOG_FILE_KEY_PREFIX = 'pawblog_file_';
const BLOG_FILE_INDEX_KEY = 'pawblog_file_index';

const BLOG_ALL_KEYS = Object.values(BLOG_STORAGE_KEYS);

// ========== 工具函数 ==========
function blogLsGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[PawBlog] 读取 ' + key + ' 失败，返回默认值:', e.message);
    return defaultValue;
  }
}

function blogLsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[PawBlog] 写入 ' + key + ' 失败:', e);
  }
}

function blogLsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) { /* ignore */ }
}

function blogGenId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function blogHashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'pw_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// 估算阅读时长（按中文每分钟 300 字）
function estimateReadingTime(content) {
  if (!content) return 1;
  const chars = content.replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(chars / 300));
}

// 提取摘要（前 200 字）
function extractExcerpt(content, maxLength = 200) {
  if (!content) return '';
  // 移除 markdown 标记
  const plain = content
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^>\s/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength) + '…';
}

// ========== 数据完整性检查 ==========
function blogCheckAndReset() {
  try {
    const savedVersion = localStorage.getItem(BLOG_STORAGE_KEYS.VERSION);
    if (savedVersion === String(BLOG_DB_VERSION)) return false;

    // 清除所有 pawblog_ 开头的旧数据
    let cleared = 0;
    for (const key of BLOG_ALL_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared++;
      }
    }
    // 同时清除残留的旧 key
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('pawblog_') || k.startsWith('pawadmin_') || k.startsWith('pawcode_'))
            && BLOG_ALL_KEYS.indexOf(k) === -1) {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => { localStorage.removeItem(k); cleared++; });
    } catch (e) { /* ignore */ }

    localStorage.setItem(BLOG_STORAGE_KEYS.VERSION, String(BLOG_DB_VERSION));
    console.log('[PawBlog] 数据初始化，已清除 ' + cleared + ' 个旧 key');
    return true;
  } catch (e) {
    console.warn('[PawBlog] 版本检测失败，尝试强制重置:', e);
    try {
      for (const key of BLOG_ALL_KEYS) {
        localStorage.removeItem(key);
      }
      localStorage.setItem(BLOG_STORAGE_KEYS.VERSION, String(BLOG_DB_VERSION));
    } catch (_) { /* ignore */ }
    return true;
  }
}

// ========== 初始化默认数据 ==========
let _blogInitialized = false;

function blogEnsureInitialized() {
  if (_blogInitialized) return;
  if (typeof window === 'undefined') return;

  const wasReset = blogCheckAndReset();

  // 管理员
  if (wasReset || !blogLsGet(BLOG_STORAGE_KEYS.ADMIN, null)) {
    const defaultAdmin = {
      id: 'admin_01',
      username: 'admin',
      password: blogHashPassword('admin123'),
      nickname: '狐小爪',
      avatar: 'preset:fox',
      bio: '一只热爱开源和写作的小狐狸 🦊 喜欢用毛茸茸的方式记录技术与生活。',
      location: '森林小屋',
      email: 'hi@pawblog.dev',
      blog: 'pawblog.dev',
      github: 'https://github.com/foxiepaws',
      skills: ['前端开发', 'React', 'Vue', 'CSS', 'UI设计', 'furry文化', '写作'],
      siteCreatedAt: Date.now() - 86400000 * 365,
    };
    blogLsSet(BLOG_STORAGE_KEYS.ADMIN, defaultAdmin);
  }

  // 示例文章
  if (wasReset || !blogLsGet(BLOG_STORAGE_KEYS.POSTS, null)) {
    const now = Date.now();
    const samplePosts = [
      {
        id: 'post_welcome',
        title: '欢迎来到 PawBlog · 爪印博客',
        excerpt: '这里是一只小狐狸的技术与生活笔记。在这里，我会分享前端开发的心得、毛茸茸的设计灵感，以及森林里的日常故事…',
        content: `# 欢迎来到 PawBlog 🦊

你好呀！我是狐小爪，一只热爱代码和毛茸茸文化的小狐狸。

这里是我的个人博客，记录我在**前端开发**、**UI 设计**和**日常生活**中的点点滴滴。

## 你会在这里找到什么

- 🎨 **设计笔记**：关于毛茸茸风格 UI 的探索与实践
- 💻 **技术文章**：前端开发中的踩坑与心得
- 🌿 **生活随笔**：森林小屋的日常碎碎念
- 🐾 **furry 文化**：关于 furry  fandom 的思考

## 为什么叫 PawBlog

爪印（Paw）是每个毛茸茸角色最可爱的标志之一。每一篇文章就像一个爪印，
一步一步，走出属于自己的路。

> 愿每一个爪印，都踩在热爱的土地上。

希望你在这里能找到有意思的东西～ 记得常来玩呀！`,
        category: '随笔',
        tags: ['furry', '博客', '介绍'],
        createdAt: now - 86400000 * 30,
        updatedAt: now - 86400000 * 30,
        published: true,
      },
      {
        id: 'post_furry-ui',
        excerpt: '毛茸茸风格的 UI 设计有哪些核心要素？从配色、圆角、阴影到图标，这篇文章分享我总结的毛茸茸设计语言…',
        title: '毛茸茸 UI 设计的五个核心要素',
        content: `# 毛茸茸 UI 设计的五个核心要素 🎨

毛茸茸（furry）风格的界面设计，核心在于营造**柔软、温暖、可爱**的感觉。
这篇文章分享我总结的五个核心设计要素。

## 1. 柔和的焦糖色系

配色是毛茸茸风格的灵魂。推荐以**焦糖棕**为主色调，搭配**奶油白**作为底色，
再用**柔雾紫**和**薄荷金**作为点缀色。

\`\`\`
焦糖棕: #B8743F  —— 主色调，温暖可靠
奶油白: #FDF6EC  —— 背景色，柔和护眼
柔雾紫: #A78BBA  —— 点缀色，梦幻感
薄荷金: #D4A657  —— 强调色，温暖亮眼
\`\`\`

## 2. 超大圆角

毛茸茸的东西都是圆润的，所以界面也要圆！

- 卡片圆角：16px ~ 24px
- 按钮圆角：12px ~ 16px
- 图片圆角：16px
- 输入框圆角：12px

## 3. 多层次柔软阴影

不要用硬邦邦的阴影，要像毛绒一样有层次感：

- 第一层：柔和的大阴影（模糊 20px+）
- 第二层：轻微的内阴影增加绒毛感
- 悬停时阴影加深，仿佛陷进毛绒里

## 4. 圆润可爱的字体

字体要选择**圆润**的风格，避免尖锐的衬线字体。

- 标题：Fredoka —— 圆润可爱，毛茸茸感十足
- 正文：Noto Sans SC —— 清晰易读，圆体风格

## 5. 爪印与小动物元素

加入一些爪印、小狐狸、小猫咪等元素作为装饰：

- 背景的爪印纹理（淡到几乎看不见）
- 加载动画用跳动的爪印
- 空状态和 404 页放一只可爱的小狐狸
- 页脚留一个爪印签名

## 写在最后

毛茸茸设计不是简单地把圆角调大，而是要从整体氛围上营造温暖柔软的感觉。
希望这篇文章对你有帮助～

下次见！🐾`,
        category: '设计',
        tags: ['UI设计', 'furry', 'CSS'],
        createdAt: now - 86400000 * 15,
        updatedAt: now - 86400000 * 10,
        published: true,
      },
      {
        id: 'post_css-soft-shadow',
        title: '用 CSS 打造柔软的毛茸茸阴影效果',
        excerpt: '想让你的按钮和卡片有毛绒绒的质感？这篇教程教你用多层 box-shadow 实现柔软的阴影效果，让界面瞬间温暖起来…',
        content: `# 用 CSS 打造柔软的毛茸茸阴影效果 ✨

普通的 box-shadow 总是显得有点"硬"，怎么才能做出像毛绒玩具一样
柔软的阴影呢？答案是——**多层阴影叠加**！

## 基础版：双层阴影

最基础的毛茸茸阴影只需要两层：

\`\`\`css
.soft-shadow {
  box-shadow: 
    0 4px 12px rgba(184, 116, 63, 0.08),
    0 8px 24px rgba(184, 116, 63, 0.12);
}
\`\`\`

第一层是近影，第二层是远影。两层叠加起来就有了柔软的层次感。

## 进阶版：三层阴影 + 内阴影

想要更有"陷进毛绒里"的感觉，可以加一层淡淡的内阴影：

\`\`\`css
.fluffy-shadow {
  box-shadow: 
    0 2px 6px rgba(184, 116, 63, 0.06),
    0 8px 20px rgba(184, 116, 63, 0.10),
    0 20px 40px rgba(184, 116, 63, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
\`\`\`

## 悬停效果

毛茸茸的卡片，悬停时要像被按下去一样：

\`\`\`css
.fluffy-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.fluffy-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 4px 12px rgba(184, 116, 63, 0.10),
    0 12px 32px rgba(184, 116, 63, 0.15),
    0 24px 48px rgba(184, 116, 63, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
\`\`\`

## 配色小贴士

阴影颜色不一定要用灰色！用主色调的低透明度版本，会让整个界面更协调：

- 焦糖棕主题 → 用 \`rgba(184, 116, 63, ...)\`
- 薄荷绿主题 → 用 \`rgba(72, 187, 120, ...)\`
- 柔雾紫主题 → 用 \`rgba(167, 139, 186, ...)\`

试试吧，你的界面会瞬间温暖起来！🐾`,
        category: '技术',
        tags: ['CSS', '前端', 'UI设计'],
        createdAt: now - 86400000 * 7,
        updatedAt: now - 86400000 * 5,
        published: true,
      },
    ];
    blogLsSet(BLOG_STORAGE_KEYS.POSTS, samplePosts);
  }

  // 设置
  if (wasReset || !blogLsGet(BLOG_STORAGE_KEYS.SETTINGS, null)) {
    blogLsSet(BLOG_STORAGE_KEYS.SETTINGS, {
      siteName: 'PawBlog',
      siteSubtitle: '一只小狐狸的技术与生活笔记',
      theme: 'caramel',
    });
  }

  // 文件索引
  if (wasReset || !blogLsGet(BLOG_FILE_INDEX_KEY, null)) {
    blogLsSet(BLOG_FILE_INDEX_KEY, {});
  }

  _blogInitialized = true;
}

// 立即初始化
try { blogEnsureInitialized(); } catch (e) { console.warn('[PawBlog] 初始化失败:', e); }

function blogEnsureReady() {
  if (!_blogInitialized) blogEnsureInitialized();
  return _blogInitialized;
}

// ========== 文章存储 ==========
const BlogPostStore = {
  getAll() {
    blogEnsureReady();
    return blogLsGet(BLOG_STORAGE_KEYS.POSTS, []);
  },

  getPublished() {
    return this.getAll().filter(p => p.published !== false);
  },

  findById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },

  getByCategory(category) {
    const posts = this.getPublished();
    if (!category || category === 'all') return posts;
    return posts.filter(p => p.category === category);
  },

  search(query) {
    const posts = this.getPublished();
    if (!query || !query.trim()) return posts;
    const q = query.toLowerCase().trim();
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  },

  getCategories() {
    const posts = this.getPublished();
    const cats = new Set(posts.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  },

  getAllTags() {
    const posts = this.getPublished();
    const tagSet = new Set();
    posts.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  },

  getAdjacentPosts(id) {
    const posts = [...this.getPublished()].sort((a, b) => b.createdAt - a.createdAt);
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? posts[idx - 1] : null,
      next: idx < posts.length - 1 ? posts[idx + 1] : null,
    };
  },

  create(data) {
    const posts = this.getAll();
    const now = Date.now();
    const post = {
      id: blogGenId('post'),
      title: data.title || '无标题',
      excerpt: data.excerpt || extractExcerpt(data.content || ''),
      content: data.content || '',
      category: data.category || '随笔',
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      published: data.published !== false,
    };
    posts.unshift(post);
    blogLsSet(BLOG_STORAGE_KEYS.POSTS, posts);
    return post;
  },

  update(id, updates) {
    const posts = this.getAll();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const updated = {
      ...posts[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    // 如果内容变了，重新生成摘要
    if (updates.content && !updates.excerpt) {
      updated.excerpt = extractExcerpt(updates.content);
    }
    posts[idx] = updated;
    blogLsSet(BLOG_STORAGE_KEYS.POSTS, posts);
    return updated;
  },

  delete(id) {
    const posts = this.getAll();
    const target = posts.find(p => p.id === id);
    const remaining = posts.filter(p => p.id !== id);
    blogLsSet(BLOG_STORAGE_KEYS.POSTS, remaining);
    // 同步删除该文章上传的所有文件
    if (target) {
      try { BlogFileStore.deleteByPostId(id); } catch (e) { /* ignore */ }
    }
  },

  estimateReadingTime,
  extractExcerpt,
};

// ========== 管理员存储 ==========
const BlogAdminStore = {
  get() {
    blogEnsureReady();
    return blogLsGet(BLOG_STORAGE_KEYS.ADMIN, null);
  },

  getPublic() {
    const admin = this.get();
    if (!admin) return null;
    const { password, ...pub } = admin;
    return pub;
  },

  update(updates) {
    const admin = this.get();
    if (!admin) return null;
    const updated = { ...admin, ...updates };
    blogLsSet(BLOG_STORAGE_KEYS.ADMIN, updated);
    return updated;
  },

  verifyPassword(password) {
    const admin = this.get();
    if (!admin) return false;
    return admin.password === blogHashPassword(password);
  },

  changePassword(oldPassword, newPassword) {
    if (!this.verifyPassword(oldPassword)) return false;
    this.update({ password: blogHashPassword(newPassword) });
    return true;
  },
};

// ========== 会话存储 ==========
const BlogSessionStore = {
  isLoggedIn() {
    blogEnsureReady();
    const session = blogLsGet(BLOG_STORAGE_KEYS.SESSION, null);
    if (!session || !session.adminId) return false;
    const admin = BlogAdminStore.get();
    return admin && admin.id === session.adminId;
  },

  getAdmin() {
    if (!this.isLoggedIn()) return null;
    return BlogAdminStore.getPublic();
  },

  login(username, password) {
    const admin = BlogAdminStore.get();
    if (!admin) return null;
    if (admin.username !== username) return null;
    if (!BlogAdminStore.verifyPassword(password)) return null;
    blogLsSet(BLOG_STORAGE_KEYS.SESSION, { adminId: admin.id, loginAt: Date.now() });
    return BlogAdminStore.getPublic();
  },

  logout() {
    blogLsRemove(BLOG_STORAGE_KEYS.SESSION);
  },
};

// ========== 文件存储（图片 & 附件） ==========
// 文件索引结构：{ fileId: { id, name, type, size, postId, kind: 'image'|'file', uploadedAt } }
// 文件数据单独存在 pawblog_file_<id> 中（base64 字符串）

const BlogFileStore = {
  _getIndex() {
    return blogLsGet(BLOG_FILE_INDEX_KEY, {});
  },
  _setIndex(index) {
    blogLsSet(BLOG_FILE_INDEX_KEY, index);
  },
  _fileKey(id) {
    return BLOG_FILE_KEY_PREFIX + id;
  },

  // 获取所有文件索引
  getAll() {
    blogEnsureReady();
    const index = this._getIndex();
    return Object.values(index).sort((a, b) => b.uploadedAt - a.uploadedAt);
  },

  // 获取某篇文章的所有文件
  getByPostId(postId) {
    return this.getAll().filter(f => f.postId === postId);
  },

  // 获取文件的 base64 数据
  getData(id) {
    try {
      return localStorage.getItem(this._fileKey(id)) || null;
    } catch (e) {
      console.warn('[PawBlog] 读取文件数据失败:', id, e.message);
      return null;
    }
  },

  // 获取文件元信息
  getInfo(id) {
    const index = this._getIndex();
    return index[id] || null;
  },

  // 保存文件（返回文件信息对象）
  save({ name, type, size, data, kind = 'file', postId = null }) {
    const id = blogGenId('file');
    const fileKey = this._fileKey(id);
    const fileInfo = {
      id,
      name: name || '未命名文件',
      type: type || 'application/octet-stream',
      size: size || 0,
      kind,
      postId,
      uploadedAt: Date.now(),
    };

    try {
      // 直接存 base64 字符串（不需要 JSON 包裹，节省空间）
      localStorage.setItem(fileKey, data);
    } catch (e) {
      console.error('[PawBlog] 写入文件数据失败 (可能超出存储限制):', e);
      throw new Error('存储空间不足，文件保存失败');
    }

    try {
      const index = this._getIndex();
      index[id] = fileInfo;
      this._setIndex(index);
    } catch (e) {
      // 索引写入失败，回滚文件数据
      try { localStorage.removeItem(fileKey); } catch (_) { /* ignore */ }
      console.error('[PawBlog] 写入文件索引失败:', e);
      throw e;
    }

    return fileInfo;
  },

  // 更新文件的所属文章
  setPostId(fileId, postId) {
    const index = this._getIndex();
    if (!index[fileId]) return null;
    index[fileId].postId = postId;
    this._setIndex(index);
    return index[fileId];
  },

  // 删除文件
  delete(id) {
    try {
      localStorage.removeItem(this._fileKey(id));
    } catch (e) { /* ignore */ }
    const index = this._getIndex();
    delete index[id];
    this._setIndex(index);
  },

  // 删除某篇文章的所有文件
  deleteByPostId(postId) {
    const files = this.getByPostId(postId);
    files.forEach(f => this.delete(f.id));
  },

  // 计算已用存储大小（所有 pawblog_ 数据）
  getStorageUsage() {
    let totalBytes = 0;
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('pawblog_')) continue;
        const val = localStorage.getItem(key);
        if (val) {
          // UTF-16 字符，每个 2 字节
          totalBytes += val.length * 2 + key.length * 2;
        }
        count++;
      }
    } catch (e) { /* ignore */ }
    return {
      bytes: totalBytes,
      kb: Math.round(totalBytes / 1024 * 10) / 10,
      mb: Math.round(totalBytes / 1024 / 1024 * 100) / 100,
      fileCount: count,
      estimatedLimit: 5, // 预估 localStorage 约 5MB
    };
  },

  // 检查剩余容量是否足够
  hasSpaceFor(additionalBytes) {
    const usage = this.getStorageUsage();
    return usage.bytes + additionalBytes < 4.5 * 1024 * 1024; // 留 0.5MB 缓冲
  },
};

// ========== 设置存储 ==========
const BlogSettingsStore = {
  get() {
    blogEnsureReady();
    return blogLsGet(BLOG_STORAGE_KEYS.SETTINGS, {});
  },

  update(updates) {
    const current = this.get();
    const updated = { ...current, ...updates };
    blogLsSet(BLOG_STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },
};

// ========== 暴露到全局 ==========
Object.assign(window, {
  PawBlog: {
    PostStore: BlogPostStore,
    AdminStore: BlogAdminStore,
    SessionStore: BlogSessionStore,
    SettingsStore: BlogSettingsStore,
    FileStore: BlogFileStore,
    hashPassword: blogHashPassword,
    estimateReadingTime,
    extractExcerpt,
  },
});
