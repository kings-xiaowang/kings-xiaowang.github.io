// 私有管理后台 - 本地数据存储层（localStorage）
// 纯前端实现，数据持久化在浏览器 localStorage 中

const STORAGE_KEYS = {
  ADMIN: 'pawadmin_admin',
  SESSION: 'pawadmin_session',
  PROJECTS: 'pawadmin_projects',
  SETTINGS: 'pawadmin_settings',
  VERSION: 'pawadmin_db_version',
};

const DB_VERSION = 1; // 后台版本 1

// 所有 pawadmin 前缀的 key
const ALL_KEYS = Object.values(STORAGE_KEYS);

// 检测并清理损坏/过期数据
function _checkAndResetIfNeeded() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (savedVersion === String(DB_VERSION)) return false;

    const reason = savedVersion === null
      ? '首次加载（无版本标记）'
      : `版本不匹配（保存: ${savedVersion}，当前: ${DB_VERSION}）`;

    // 清除所有旧数据
    let cleared = 0;
    for (const key of ALL_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared++;
      }
    }
    // 同时清除可能残留的旧版本 key（以 pawadmin_ / pawcode_ 开头的）
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('pawadmin_') || k.startsWith('pawcode_')) && ALL_KEYS.indexOf(k) === -1) {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => { localStorage.removeItem(k); cleared++; });
    } catch (e) { /* ignore */ }

    localStorage.setItem(STORAGE_KEYS.VERSION, String(DB_VERSION));
    console.log(`[AdminDB] ${reason}，已重置数据（清除 ${cleared} 个 key）`);
    return true;
  } catch (e) {
    console.warn('[AdminDB] 版本检测失败，尝试强制重置:', e);
    try {
      for (const key of ALL_KEYS) {
        localStorage.removeItem(key);
      }
      localStorage.setItem(STORAGE_KEYS.VERSION, String(DB_VERSION));
    } catch (_) { /* ignore */ }
    return true;
  }
}

// ========== 工具函数 ==========
function lsGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[AdminDB] 读取 ${key} 失败，返回默认值:`, e.message);
    return defaultValue;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage 写入失败:', e);
  }
}

function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) { /* ignore */ }
}

function genId(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function hashPassword(password) {
  // 简单哈希（纯前端演示用，非安全用途）
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'pw_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// ========== 初始化默认数据 ==========
let _initialized = false;

function ensureInitialized() {
  if (_initialized) return;
  if (typeof window === 'undefined') return;

  // 先做版本 / 数据完整性检查
  const wasReset = _checkAndResetIfNeeded();

  // 如果没重置过且已有初始化数据，直接用
  if (!wasReset && lsGet(STORAGE_KEYS.ADMIN, null)) {
    _initialized = true;
    return;
  }

  _initialized = true;

  // 默认管理员
  const defaultAdmin = {
    id: 'admin_001',
    username: 'admin',
    nickname: '小狐狸管理员',
    email: 'admin@pawcode.dev',
    password: hashPassword('admin123'),
    avatar: 'preset:fox',
    bio: '一只热爱开源的小狐狸 🦊 喜欢用毛茸茸的方式写代码。',
    location: '森林小屋',
    blog: 'foxiepaws.dev',
    socialLinks: [
      { platform: 'GitHub', url: 'https://github.com/foxiepaws' },
      { platform: 'Twitter', url: 'https://twitter.com/foxiepaws' },
    ],
    createdAt: Date.now() - 86400000 * 365,
  };
  lsSet(STORAGE_KEYS.ADMIN, defaultAdmin);

  // 示例项目
  const sampleProjects = [
    {
      id: 'proj_sample1',
      name: 'paw-ui-kit',
      description: '一套毛茸茸风格的 UI 组件库，专为 furry 爱好者打造',
      category: '前端开发',
      language: 'TypeScript',
      topics: ['ui', 'component', 'furry'],
      linkUrl: 'https://github.com/foxiepaws/paw-ui-kit',
      readme: '# Paw UI Kit\n\n一套毛茸茸风格的 UI 组件库。\n\n## 特性\n- 🦊 可爱的毛茸茸风格\n- 🎨 丰富的主题色\n- 📦 开箱即用',
      images: [],
      files: [],
      views: 1248,
      createdAt: Date.now() - 86400000 * 90,
      updatedAt: Date.now() - 86400000 * 7,
    },
    {
      id: 'proj_sample2',
      name: 'fox-tracker',
      description: '轻量级的个人任务追踪工具，支持番茄钟和习惯养成',
      category: '效率工具',
      language: 'JavaScript',
      topics: ['productivity', 'tracker', 'pomodoro'],
      linkUrl: '',
      readme: '# Fox Tracker\n\n小狐狸的任务追踪工具。',
      images: [],
      files: [],
      views: 856,
      createdAt: Date.now() - 86400000 * 60,
      updatedAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'proj_sample3',
      name: 'furry-avatar-generator',
      description: '在线生成个性化 furry 头像，支持数百种组合',
      category: '创意设计',
      language: 'Vue',
      topics: ['avatar', 'generator', 'art'],
      linkUrl: 'https://avatar.foxiepaws.dev',
      readme: '# Furry Avatar Generator\n\n生成属于你的 furry 头像！',
      images: [],
      files: [],
      views: 2341,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 1,
    },
  ];
  lsSet(STORAGE_KEYS.PROJECTS, sampleProjects);

  // 默认设置
  lsSet(STORAGE_KEYS.SETTINGS, {
    siteName: 'PawAdmin 管理后台',
    theme: 'caramel',
  });

  console.log('[AdminDB] 已初始化默认数据');
}

// 尝试立即初始化
try { ensureInitialized(); } catch(e) {}

function _ensureReady() {
  if (!_initialized) ensureInitialized();
  return _initialized;
}

// ========== 管理员存储 ==========
const AdminStore = {
  get() {
    _ensureReady();
    return lsGet(STORAGE_KEYS.ADMIN, null);
  },
  update(updates) {
    const admin = this.get();
    if (!admin) return null;
    const updated = { ...admin, ...updates };
    lsSet(STORAGE_KEYS.ADMIN, updated);
    return updated;
  },
  verifyPassword(password) {
    const admin = this.get();
    if (!admin) return false;
    return admin.password === hashPassword(password);
  },
  changePassword(oldPassword, newPassword) {
    if (!this.verifyPassword(oldPassword)) return false;
    this.update({ password: hashPassword(newPassword) });
    return true;
  },
};

// ========== 会话存储 ==========
const SessionStore = {
  isLoggedIn() {
    _ensureReady();
    const session = lsGet(STORAGE_KEYS.SESSION, null);
    if (!session || !session.adminId) return false;
    const admin = AdminStore.get();
    return admin && admin.id === session.adminId;
  },
  getAdmin() {
    if (!this.isLoggedIn()) return null;
    return AdminStore.get();
  },
  login(username, password) {
    const admin = AdminStore.get();
    if (!admin) return null;
    if (admin.username !== username) return null;
    if (!AdminStore.verifyPassword(password)) return null;
    lsSet(STORAGE_KEYS.SESSION, { adminId: admin.id, loginAt: Date.now() });
    return admin;
  },
  logout() {
    lsRemove(STORAGE_KEYS.SESSION);
  },
};

// ========== 项目存储 ==========
const ProjectStore = {
  getAll() {
    _ensureReady();
    return lsGet(STORAGE_KEYS.PROJECTS, []);
  },
  findById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },
  create(data) {
    const projects = this.getAll();
    const now = Date.now();
    const project = {
      id: genId('proj'),
      name: data.name || 'new-project',
      description: data.description || '',
      category: data.category || '未分类',
      language: data.language || 'JavaScript',
      topics: data.topics || [],
      linkUrl: data.linkUrl || '',
      readme: data.readme || '',
      images: data.images || [],
      files: data.files || [],
      views: 0,
      createdAt: now,
      updatedAt: now,
    };
    projects.unshift(project);
    lsSet(STORAGE_KEYS.PROJECTS, projects);
    return project;
  },
  update(id, updates) {
    const projects = this.getAll();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    projects[idx] = { ...projects[idx], ...updates, updatedAt: Date.now() };
    lsSet(STORAGE_KEYS.PROJECTS, projects);
    return projects[idx];
  },
  delete(id) {
    const projects = this.getAll().filter(p => p.id !== id);
    lsSet(STORAGE_KEYS.PROJECTS, projects);
  },
  clearAll() {
    lsSet(STORAGE_KEYS.PROJECTS, []);
  },
  importAll(projects) {
    lsSet(STORAGE_KEYS.PROJECTS, projects || []);
  },
  search(query, filters = {}) {
    let projects = this.getAll();
    if (query && query.trim()) {
      const q = query.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.topics && p.topics.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (filters.category && filters.category !== 'all') {
      projects = projects.filter(p => p.category === filters.category);
    }
    if (filters.language && filters.language !== 'all') {
      projects = projects.filter(p => p.language === filters.language);
    }
    return projects;
  },
  getCategories() {
    const projects = this.getAll();
    const cats = new Set(projects.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  },
  getLanguages() {
    const projects = this.getAll();
    const langs = new Set(projects.map(p => p.language).filter(Boolean));
    return Array.from(langs);
  },
  getStats() {
    const projects = this.getAll();
    const totalViews = projects.reduce((s, p) => s + (p.views || 0), 0);
    const categories = new Set(projects.map(p => p.category).filter(Boolean));
    const lastUpdated = projects.length > 0
      ? Math.max(...projects.map(p => p.updatedAt || 0))
      : 0;
    return {
      projectCount: projects.length,
      categoryCount: categories.size,
      totalViews,
      lastUpdated,
    };
  },
};

// ========== 数据导入导出 ==========
const DataStore = {
  exportAll() {
    _ensureReady();
    const admin = AdminStore.get();
    const projects = ProjectStore.getAll();
    const { password, ...adminWithoutPassword } = admin || {};
    return {
      version: DB_VERSION,
      exportedAt: Date.now(),
      admin: adminWithoutPassword,
      projects,
    };
  },
  importAll(data, options = {}) {
    if (!data || typeof data !== 'object') return false;

    // 导入管理员信息（不含密码）
    if (data.admin) {
      const current = AdminStore.get() || {};
      // 保留密码
      AdminStore.update({
        ...current,
        ...data.admin,
        password: current.password || hashPassword('admin123'),
      });
    }

    // 导入项目（覆盖）
    if (data.projects && Array.isArray(data.projects)) {
      ProjectStore.importAll(data.projects);
    }

    return true;
  },
  clearProjects() {
    ProjectStore.clearAll();
  },
  resetAll() {
    // 清除所有数据并重新初始化
    for (const key of ALL_KEYS) {
      lsRemove(key);
    }
    _initialized = false;
    ensureInitialized();
  },
};

// 暴露到全局
Object.assign(window, {
  AdminDB: {
    AdminStore, SessionStore, ProjectStore, DataStore,
    hashPassword, ensureInitialized, STORAGE_KEYS, DB_VERSION,
  },
});
