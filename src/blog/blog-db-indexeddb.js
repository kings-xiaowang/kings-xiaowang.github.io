// PawBlog IndexedDB 数据层
// 主存储：IndexedDB（大容量）
// 降级存储：localStorage（浏览器不支持 IndexedDB 时使用，API 一致）
// 所有操作都是异步 Promise，错误都有 try-catch

const PawDB = (function () {
  const DB_NAME = 'PawBlogDB';
  const DB_VERSION = 1;

  const STORES = {
    ARTICLES: 'articles',
    FILES: 'files',
    ADMIN: 'admin',
    SETTINGS: 'settings',
  };

  const LS_KEYS = {
    ARTICLES: 'pawdb_articles',
    FILE_INDEX: 'pawdb_file_index',
    ADMIN: 'pawdb_admin',
    SETTINGS: 'pawdb_settings',
  };
  const LS_FILE_PREFIX = 'pawdb_file_';

  let db = null;
  let initPromise = null;
  let useLocalStorage = false;
  let initError = null;

  // ========== 入口初始化 ==========
  function init() {
    if (initPromise) return initPromise;

    initPromise = (async function () {
      // 先尝试 IndexedDB
      if (window.indexedDB) {
        try {
          await initIndexedDB();
          console.log('[PawDB] IndexedDB 初始化成功');
          useLocalStorage = false;
        } catch (err) {
          console.warn('[PawDB] IndexedDB 初始化失败，降级到 localStorage:', err.message);
          initError = err;
          useLocalStorage = true;
        }
      } else {
        console.warn('[PawDB] 浏览器不支持 IndexedDB，使用 localStorage');
        useLocalStorage = true;
      }

      // 数据迁移（旧版 pawblog_ → 新版 PawDB）
      try {
        await tryMigrateLegacyData();
      } catch (e) {
        console.warn('[PawDB] 数据迁移跳过:', e.message);
      }

      // 确保默认数据
      try {
        await ensureDefaultData();
      } catch (e) {
        console.warn('[PawDB] 默认数据初始化失败:', e.message);
      }

      return true;
    })();

    return initPromise;
  }

  function ensureReady() {
    if (!initPromise) return init();
    return initPromise;
  }

  // ========== IndexedDB 初始化 ==========
  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        reject(new Error('IndexedDB 打开超时'));
      }, 5000);

      request.onerror = () => {
        if (timedOut) return;
        clearTimeout(timer);
        reject(request.error || new Error('IndexedDB 打开失败'));
      };

      request.onblocked = () => {
        if (timedOut) return;
        clearTimeout(timer);
        reject(new Error('IndexedDB 被其他标签页阻塞'));
      };

      request.onupgradeneeded = (event) => {
        const idb = event.target.result;
        try {
          if (!idb.objectStoreNames.contains(STORES.ARTICLES)) {
            const s = idb.createObjectStore(STORES.ARTICLES, { keyPath: 'id' });
            s.createIndex('category', 'category', { unique: false });
            s.createIndex('createdAt', 'createdAt', { unique: false });
            s.createIndex('published', 'published', { unique: false });
          }
          if (!idb.objectStoreNames.contains(STORES.FILES)) {
            const s = idb.createObjectStore(STORES.FILES, { keyPath: 'id' });
            s.createIndex('postId', 'postId', { unique: false });
            s.createIndex('kind', 'kind', { unique: false });
            s.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          }
          if (!idb.objectStoreNames.contains(STORES.ADMIN)) {
            idb.createObjectStore(STORES.ADMIN, { keyPath: 'id' });
          }
          if (!idb.objectStoreNames.contains(STORES.SETTINGS)) {
            idb.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
          }
        } catch (e) {
          console.error('[PawDB] 创建 object store 失败:', e);
        }
      };

      request.onsuccess = (event) => {
        if (timedOut) return;
        clearTimeout(timer);
        db = event.target.result;
        db.onversionchange = () => {
          try { db.close(); } catch (e) { /* ignore */ }
        };
        db.onclose = () => {
          console.warn('[PawDB] 数据库连接意外关闭');
        };
        db.onerror = (e) => {
          console.warn('[PawDB] 数据库错误:', e.target.error);
        };
        resolve();
      };
    });
  }

  // ========== localStorage 降级工具 ==========
  function lsGet(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[PawDB-LS] 读取失败:', key, e.message);
      return defaultValue;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[PawDB-LS] 写入失败:', key, e.message);
      return false;
    }
  }

  function lsRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
  }

  // ========== 旧数据迁移 ==========
  async function tryMigrateLegacyData() {
    // 检查是否有旧的 pawblog_ 数据
    const hasLegacy = Object.keys(localStorage).some(k => k.startsWith('pawblog_'));
    if (!hasLegacy) return;

    // 检查新库是否已有数据
    const artCount = await _countArticles();
    if (artCount > 0) {
      // 已有数据，只清理旧 key
      clearLegacyKeys();
      return;
    }

    console.log('[PawDB] 发现旧数据，开始迁移...');
    let count = 0;

    try {
      // 迁移文章
      const postsStr = localStorage.getItem('pawblog_posts');
      if (postsStr) {
        const posts = JSON.parse(postsStr);
        for (const p of posts) {
          await _saveArticleRaw(p);
          count++;
        }
      }
      // 迁移管理员
      const adminStr = localStorage.getItem('pawblog_admin');
      if (adminStr) {
        await _saveAdminRaw(JSON.parse(adminStr));
        count++;
      }
      // 迁移设置
      const settingsStr = localStorage.getItem('pawblog_settings');
      if (settingsStr) {
        const s = JSON.parse(settingsStr);
        for (const [k, v] of Object.entries(s)) {
          await _saveSettingRaw(k, v);
        }
        count++;
      }
      // 迁移文件
      const fileIdxStr = localStorage.getItem('pawblog_file_index');
      if (fileIdxStr) {
        const idx = JSON.parse(fileIdxStr);
        for (const [fid, finfo] of Object.entries(idx)) {
          const fdata = localStorage.getItem('pawblog_file_' + fid);
          if (fdata) {
            await _saveFileRaw({ ...finfo, data: fdata });
            count++;
          }
        }
      }
      console.log(`[PawDB] 迁移完成：${count} 条数据`);
      clearLegacyKeys();
    } catch (e) {
      console.warn('[PawDB] 迁移出错，保留旧数据:', e.message);
    }
  }

  function clearLegacyKeys() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('pawblog_')) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  }

  // ========== 默认数据 ==========
  async function ensureDefaultData() {
    const artCount = await _countArticles();
    const admin = await _getAdmin();

    if (!admin) {
      await _saveAdminRaw({
        id: 'admin_01',
        username: 'admin',
        password: hashPassword('admin123'),
        nickname: 'kings小wang',
        avatar: 'preset:fox',
        bio: '热爱开源和写作，喜欢用毛茸茸的方式记录技术与生活。',
        location: '森林小屋',
        email: 'hi@kingswang.blog',
        blog: 'kingswang.blog',
        github: 'https://github.com/kingsxiaowang',
        skills: ['前端开发', 'React', 'Vue', 'CSS', 'UI设计', 'furry文化', '写作'],
        siteCreatedAt: Date.now() - 86400000 * 365,
      });
    }

    if (artCount === 0) {
      const now = Date.now();
      const posts = [
        {
          id: 'post_welcome',
          title: '欢迎来到 kings小wang的个人博客',
          excerpt: '这里是一个记录生活与代码的毛茸茸角落。在这里，我会分享前端开发的心得、毛茸茸的设计灵感，以及日常生活里的点点滴滴…',
          content: '# 欢迎来到 kings小wang的个人博客 🦊\n\n你好呀！欢迎来到我的小窝～ 这里是一个记录**生活**与**代码**的毛茸茸角落。\n\n我是这里的主人，一只热爱代码和毛茸茸文化的小狐狸。\n\n## 你会在这里找到什么\n\n- 🎨 **设计笔记**：关于毛茸茸风格 UI 的探索与实践\n- 💻 **技术文章**：前端开发中的踩坑与心得\n- 🌿 **生活随笔**：森林小屋的日常碎碎念\n- 🐾 **furry 文化**：关于 furry fandom 的思考\n\n## 关于这个博客\n\n这里就像一本在线的笔记本，记录着我一路走来的点点滴滴。\n无论是技术上的收获，还是生活中的小确幸，都想在这里留下痕迹。\n\n> 愿每一个爪印，都踩在热爱的土地上。\n\n希望你在这里能找到有意思的东西～ 记得常来玩呀！',
          category: '随笔',
          tags: ['furry', '博客', '介绍'],
          createdAt: now - 86400000 * 30,
          updatedAt: now - 86400000 * 30,
          published: true,
        },
        {
          id: 'post_furry-ui',
          title: '毛茸茸 UI 设计的五个核心要素',
          excerpt: '毛茸茸风格的 UI 设计有哪些核心要素？从配色、圆角、阴影到图标，这篇文章分享我总结的毛茸茸设计语言…',
          content: '# 毛茸茸 UI 设计的五个核心要素 🎨\n\n毛茸茸（furry）风格的界面设计，核心在于营造**柔软、温暖、可爱**的感觉。\n这篇文章分享我总结的五个核心设计要素。\n\n## 1. 柔和的焦糖色系\n\n配色是毛茸茸风格的灵魂。推荐以**焦糖棕**为主色调，搭配**奶油白**作为底色，\n再用**柔雾紫**和**薄荷金**作为点缀色。\n\n\`\`\`\n焦糖棕: #B8743F  —— 主色调，温暖可靠\n奶油白: #FDF6EC  —— 背景色，柔和护眼\n柔雾紫: #A78BBA  —— 点缀色，梦幻感\n薄荷金: #D4A657  —— 强调色，温暖亮眼\n\`\`\`\n\n## 2. 超大圆角\n\n毛茸茸的东西都是圆润的，所以界面也要圆！\n\n- 卡片圆角：16px ~ 24px\n- 按钮圆角：12px ~ 16px\n- 图片圆角：16px\n- 输入框圆角：12px\n\n## 3. 多层次柔软阴影\n\n不要用硬邦邦的阴影，要像毛绒一样有层次感：\n\n- 第一层：柔和的大阴影（模糊 20px+）\n- 第二层：轻微的内阴影增加绒毛感\n- 悬停时阴影加深，仿佛陷进毛绒里\n\n## 4. 圆润可爱的字体\n\n字体要选择**圆润**的风格，避免尖锐的衬线字体。\n\n- 标题：Fredoka —— 圆润可爱，毛茸茸感十足\n- 正文：Noto Sans SC —— 清晰易读，圆体风格\n\n## 5. 爪印与小动物元素\n\n加入一些爪印、小狐狸、小猫咪等元素作为装饰：\n\n- 背景的爪印纹理（淡到几乎看不见）\n- 加载动画用跳动的爪印\n- 空状态和 404 页放一只可爱的小狐狸\n- 页脚留一个爪印签名\n\n## 写在最后\n\n毛茸茸设计不是简单地把圆角调大，而是要从整体氛围上营造温暖柔软的感觉。\n希望这篇文章对你有帮助～\n\n下次见！🐾',
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
          content: '# 用 CSS 打造柔软的毛茸茸阴影效果 ✨\n\n普通的 box-shadow 总是显得有点"硬"，怎么才能做出像毛绒玩具一样\n柔软的阴影呢？答案是——**多层阴影叠加**！\n\n## 基础版：双层阴影\n\n最基础的毛茸茸阴影只需要两层：\n\n\`\`\`css\n.soft-shadow {\n  box-shadow: \n    0 4px 12px rgba(184, 116, 63, 0.08),\n    0 8px 24px rgba(184, 116, 63, 0.12);\n}\n\`\`\`\n\n第一层是近影，第二层是远影。两层叠加起来就有了柔软的层次感。\n\n## 进阶版：三层阴影 + 内阴影\n\n想要更有"陷进毛绒里"的感觉，可以加一层淡淡的内阴影：\n\n\`\`\`css\n.fluffy-shadow {\n  box-shadow: \n    0 2px 6px rgba(184, 116, 63, 0.06),\n    0 8px 20px rgba(184, 116, 63, 0.10),\n    0 20px 40px rgba(184, 116, 63, 0.08),\n    inset 0 1px 0 rgba(255, 255, 255, 0.6);\n}\n\`\`\`\n\n## 悬停效果\n\n毛茸茸的卡片，悬停时要像被按下去一样：\n\n\`\`\`css\n.fluffy-card {\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n\n.fluffy-card:hover {\n  transform: translateY(-2px);\n  box-shadow: \n    0 4px 12px rgba(184, 116, 63, 0.10),\n    0 12px 32px rgba(184, 116, 63, 0.15),\n    0 24px 48px rgba(184, 116, 63, 0.10),\n    inset 0 1px 0 rgba(255, 255, 255, 0.7);\n}\n\`\`\`\n\n## 配色小贴士\n\n阴影颜色不一定要用灰色！用主色调的低透明度版本，会让整个界面更协调：\n\n- 焦糖棕主题 → 用 \`rgba(184, 116, 63, ...)\`\n- 薄荷绿主题 → 用 \`rgba(72, 187, 120, ...)\`\n- 柔雾紫主题 → 用 \`rgba(167, 139, 186, ...)\`\n\n试试吧，你的界面会瞬间温暖起来！🐾',
          category: '技术',
          tags: ['CSS', '前端', 'UI设计'],
          createdAt: now - 86400000 * 7,
          updatedAt: now - 86400000 * 5,
          published: true,
        },
      ];
      for (const p of posts) {
        await _saveArticleRaw(p);
      }
    }

    // 设置
    const s1 = await _getSetting('siteName');
    if (s1 == null) await _saveSettingRaw('siteName', 'kings小wang的个人博客');
    const s2 = await _getSetting('siteSubtitle');
    if (s2 == null) await _saveSettingRaw('siteSubtitle', '记录生活与代码的毛茸茸角落');
    const s3 = await _getSetting('theme');
    if (s3 == null) await _saveSettingRaw('theme', 'caramel');
  }

  // ========== 底层存储操作（双模式） ==========
  // 所有 _ 开头的函数是内部底层操作，自动选择 IndexedDB 或 localStorage

  function idbPromisify(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IDB error'));
    });
  }

  function idbTx(storeName, mode) {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async function _countArticles() {
    if (useLocalStorage) {
      const list = lsGet(LS_KEYS.ARTICLES, []);
      return list.length;
    }
    try {
      const store = idbTx(STORES.ARTICLES, 'readonly');
      return await idbPromisify(store.count());
    } catch (e) {
      console.warn('[PawDB] countArticles 失败:', e);
      return 0;
    }
  }

  async function _getAllArticles() {
    if (useLocalStorage) {
      return lsGet(LS_KEYS.ARTICLES, []);
    }
    try {
      const store = idbTx(STORES.ARTICLES, 'readonly');
      return await idbPromisify(store.getAll());
    } catch (e) {
      console.warn('[PawDB] getAllArticles 失败:', e);
      return [];
    }
  }

  async function _getArticle(id) {
    if (useLocalStorage) {
      const list = lsGet(LS_KEYS.ARTICLES, []);
      return list.find(a => a.id === id) || null;
    }
    try {
      const store = idbTx(STORES.ARTICLES, 'readonly');
      return await idbPromisify(store.get(id));
    } catch (e) {
      console.warn('[PawDB] getArticle 失败:', e);
      return null;
    }
  }

  async function _saveArticleRaw(article) {
    if (useLocalStorage) {
      const list = lsGet(LS_KEYS.ARTICLES, []);
      const idx = list.findIndex(a => a.id === article.id);
      if (idx >= 0) list[idx] = article;
      else list.unshift(article);
      lsSet(LS_KEYS.ARTICLES, list);
      return article;
    }
    try {
      const store = idbTx(STORES.ARTICLES, 'readwrite');
      await idbPromisify(store.put(article));
      return article;
    } catch (e) {
      console.error('[PawDB] saveArticle 失败:', e);
      throw e;
    }
  }

  async function _deleteArticle(id) {
    if (useLocalStorage) {
      const list = lsGet(LS_KEYS.ARTICLES, []).filter(a => a.id !== id);
      lsSet(LS_KEYS.ARTICLES, list);
      return;
    }
    try {
      const store = idbTx(STORES.ARTICLES, 'readwrite');
      await idbPromisify(store.delete(id));
    } catch (e) {
      console.warn('[PawDB] deleteArticle 失败:', e);
    }
  }

  // 文件
  async function _getAllFiles() {
    if (useLocalStorage) {
      const idx = lsGet(LS_KEYS.FILE_INDEX, {});
      return Object.values(idx);
    }
    try {
      const store = idbTx(STORES.FILES, 'readonly');
      return await idbPromisify(store.getAll());
    } catch (e) {
      console.warn('[PawDB] getAllFiles 失败:', e);
      return [];
    }
  }

  async function _getFile(id) {
    if (useLocalStorage) {
      const idx = lsGet(LS_KEYS.FILE_INDEX, {});
      const info = idx[id];
      if (!info) return null;
      const data = localStorage.getItem(LS_FILE_PREFIX + id);
      return { ...info, data: data || null };
    }
    try {
      const store = idbTx(STORES.FILES, 'readonly');
      return await idbPromisify(store.get(id));
    } catch (e) {
      console.warn('[PawDB] getFile 失败:', e);
      return null;
    }
  }

  async function _saveFileRaw(fileObj) {
    if (useLocalStorage) {
      const idx = lsGet(LS_KEYS.FILE_INDEX, {});
      const { data, ...info } = fileObj;
      idx[fileObj.id] = info;
      lsSet(LS_KEYS.FILE_INDEX, idx);
      try {
        localStorage.setItem(LS_FILE_PREFIX + fileObj.id, data || '');
      } catch (e) {
        console.warn('[PawDB-LS] 存文件数据失败:', e.message);
      }
      return fileObj;
    }
    try {
      const store = idbTx(STORES.FILES, 'readwrite');
      await idbPromisify(store.put(fileObj));
      return fileObj;
    } catch (e) {
      console.error('[PawDB] saveFile 失败:', e);
      throw e;
    }
  }

  async function _deleteFile(id) {
    if (useLocalStorage) {
      const idx = lsGet(LS_KEYS.FILE_INDEX, {});
      delete idx[id];
      lsSet(LS_KEYS.FILE_INDEX, idx);
      lsRemove(LS_FILE_PREFIX + id);
      return;
    }
    try {
      const store = idbTx(STORES.FILES, 'readwrite');
      await idbPromisify(store.delete(id));
    } catch (e) {
      console.warn('[PawDB] deleteFile 失败:', e);
    }
  }

  // 管理员
  async function _getAdmin() {
    if (useLocalStorage) {
      return lsGet(LS_KEYS.ADMIN, null);
    }
    try {
      const store = idbTx(STORES.ADMIN, 'readonly');
      const all = await idbPromisify(store.getAll());
      return all[0] || null;
    } catch (e) {
      console.warn('[PawDB] getAdmin 失败:', e);
      return null;
    }
  }

  async function _saveAdminRaw(admin) {
    if (useLocalStorage) {
      lsSet(LS_KEYS.ADMIN, admin);
      return admin;
    }
    try {
      const store = idbTx(STORES.ADMIN, 'readwrite');
      await idbPromisify(store.put(admin));
      return admin;
    } catch (e) {
      console.error('[PawDB] saveAdmin 失败:', e);
      throw e;
    }
  }

  // 设置
  async function _getSetting(key, defaultValue = null) {
    if (useLocalStorage) {
      const obj = lsGet(LS_KEYS.SETTINGS, {});
      return obj[key] !== undefined ? obj[key] : defaultValue;
    }
    try {
      const store = idbTx(STORES.SETTINGS, 'readonly');
      const entry = await idbPromisify(store.get(key));
      return entry ? entry.value : defaultValue;
    } catch (e) {
      console.warn('[PawDB] getSetting 失败:', e);
      return defaultValue;
    }
  }

  async function _getAllSettings() {
    if (useLocalStorage) {
      return lsGet(LS_KEYS.SETTINGS, {});
    }
    try {
      const store = idbTx(STORES.SETTINGS, 'readonly');
      const all = await idbPromisify(store.getAll());
      const obj = {};
      all.forEach(e => { obj[e.key] = e.value; });
      return obj;
    } catch (e) {
      console.warn('[PawDB] getAllSettings 失败:', e);
      return {};
    }
  }

  async function _saveSettingRaw(key, value) {
    if (useLocalStorage) {
      const obj = lsGet(LS_KEYS.SETTINGS, {});
      obj[key] = value;
      lsSet(LS_KEYS.SETTINGS, obj);
      return;
    }
    try {
      const store = idbTx(STORES.SETTINGS, 'readwrite');
      await idbPromisify(store.put({ key, value }));
    } catch (e) {
      console.warn('[PawDB] saveSetting 失败:', e);
    }
  }

  async function _clearAll() {
    if (useLocalStorage) {
      lsRemove(LS_KEYS.ARTICLES);
      lsRemove(LS_KEYS.FILE_INDEX);
      lsRemove(LS_KEYS.ADMIN);
      lsRemove(LS_KEYS.SETTINGS);
      // 清除所有文件
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(LS_FILE_PREFIX)) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
      } catch (e) { /* ignore */ }
      return;
    }
    try {
      const tx = db.transaction(
        [STORES.ARTICLES, STORES.FILES, STORES.ADMIN, STORES.SETTINGS],
        'readwrite'
      );
      tx.objectStore(STORES.ARTICLES).clear();
      tx.objectStore(STORES.FILES).clear();
      tx.objectStore(STORES.ADMIN).clear();
      tx.objectStore(STORES.SETTINGS).clear();
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[PawDB] clearAll 失败:', e);
    }
  }

  // ========== 工具函数 ==========
  function genId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const chr = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return 'pw_' + Math.abs(hash).toString(36) + '_' + password.length;
  }

  function estimateReadingTime(content) {
    if (!content) return 1;
    const chars = content.replace(/\s/g, '').length;
    return Math.max(1, Math.ceil(chars / 300));
  }

  function extractExcerpt(content, maxLength = 200) {
    if (!content) return '';
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

  function formatFileSize(bytes) {
    if (!bytes || bytes < 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  // ========== 公共 API：文章 ==========
  async function getArticles(onlyPublished = true) {
    await ensureReady();
    let articles = await _getAllArticles();
    if (onlyPublished) {
      articles = articles.filter(a => a.published !== false);
    }
    return articles.sort((a, b) => b.createdAt - a.createdAt);
  }

  async function getArticleById(id) {
    await ensureReady();
    return await _getArticle(id);
  }

  async function searchArticles(query, onlyPublished = true) {
    const articles = await getArticles(onlyPublished);
    if (!query || !query.trim()) return articles;
    const q = query.toLowerCase().trim();
    return articles.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  async function getCategories() {
    const articles = await getArticles(true);
    const cats = new Set(articles.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }

  async function getAdjacentArticles(id) {
    const articles = (await getArticles(true)).sort((a, b) => b.createdAt - a.createdAt);
    const idx = articles.findIndex(p => p.id === id);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? articles[idx - 1] : null,
      next: idx < articles.length - 1 ? articles[idx + 1] : null,
    };
  }

  async function createArticle(data) {
    await ensureReady();
    const now = Date.now();
    const article = {
      id: genId('post'),
      title: data.title || '无标题',
      excerpt: data.excerpt || extractExcerpt(data.content || ''),
      content: data.content || '',
      category: data.category || '随笔',
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      published: data.published !== false,
    };
    await _saveArticleRaw(article);
    return article;
  }

  async function updateArticle(id, updates) {
    await ensureReady();
    const existing = await _getArticle(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    if (updates.content && !updates.excerpt) {
      updated.excerpt = extractExcerpt(updates.content);
    }
    await _saveArticleRaw(updated);
    return updated;
  }

  async function deleteArticle(id) {
    await ensureReady();
    // 先删关联文件
    const files = await getFilesByPostId(id);
    for (const f of files) {
      await deleteFile(f.id);
    }
    await _deleteArticle(id);
  }

  // ========== 公共 API：文件 ==========
  async function saveFile({ name, type, size, data, kind = 'file', postId = null }) {
    await ensureReady();
    const fileObj = {
      id: genId('file'),
      name: name || '未命名文件',
      type: type || 'application/octet-stream',
      size: size || 0,
      kind,
      postId,
      uploadedAt: Date.now(),
      data,
    };
    await _saveFileRaw(fileObj);
    const { data: _, ...info } = fileObj;
    return info;
  }

  async function getFileInfo(id) {
    await ensureReady();
    const f = await _getFile(id);
    if (!f) return null;
    const { data, ...info } = f;
    return info;
  }

  async function getFileData(id) {
    await ensureReady();
    const f = await _getFile(id);
    return f ? f.data : null;
  }

  async function getFilesByPostId(postId) {
    await ensureReady();
    const all = await _getAllFiles();
    return all
      .filter(f => f.postId === postId)
      .map(f => { const { data, ...info } = f; return info; })
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  async function getAllFiles() {
    await ensureReady();
    const all = await _getAllFiles();
    return all
      .map(f => { const { data, ...info } = f; return info; })
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  async function setFilePostId(fileId, postId) {
    await ensureReady();
    const f = await _getFile(fileId);
    if (!f) return null;
    f.postId = postId;
    await _saveFileRaw(f);
    const { data, ...info } = f;
    return info;
  }

  async function deleteFile(id) {
    await ensureReady();
    await _deleteFile(id);
  }

  // ========== 公共 API：管理员 ==========
  async function getAdmin() {
    await ensureReady();
    return await _getAdmin();
  }

  async function getAdminPublic() {
    const admin = await getAdmin();
    if (!admin) return null;
    const { password, ...pub } = admin;
    return pub;
  }

  async function updateAdmin(updates) {
    await ensureReady();
    const existing = await _getAdmin();
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await _saveAdminRaw(updated);
    return updated;
  }

  async function verifyPassword(password) {
    const admin = await getAdmin();
    if (!admin) return false;
    return admin.password === hashPassword(password);
  }

  // ========== 会话 ==========
  let sessionAdmin = null;

  function isLoggedIn() {
    return !!sessionAdmin;
  }

  function getCurrentAdmin() {
    return sessionAdmin;
  }

  async function login(username, password) {
    const admin = await getAdmin();
    if (!admin) return null;
    if (admin.username !== username) return null;
    if (!(await verifyPassword(password))) return null;
    const { password: _, ...pub } = admin;
    sessionAdmin = pub;
    try { sessionStorage.setItem('pawdb_session', admin.id); } catch (e) { /* ignore */ }
    return pub;
  }

  function logout() {
    sessionAdmin = null;
    try { sessionStorage.removeItem('pawdb_session'); } catch (e) { /* ignore */ }
  }

  async function restoreSession() {
    try {
      const adminId = sessionStorage.getItem('pawdb_session');
      if (adminId) {
        const admin = await getAdmin();
        if (admin && admin.id === adminId) {
          const { password: _, ...pub } = admin;
          sessionAdmin = pub;
          return true;
        }
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  // ========== 公共 API：设置 ==========
  async function getSetting(key, defaultValue = null) {
    await ensureReady();
    return await _getSetting(key, defaultValue);
  }

  async function getAllSettings() {
    await ensureReady();
    return await _getAllSettings();
  }

  async function putSetting(key, value) {
    await ensureReady();
    await _saveSettingRaw(key, value);
  }

  // ========== 存储统计 ==========
  async function getStorageUsage() {
    await ensureReady();

    const articlesCount = await _countArticles();
    let filesCount = 0;
    let totalBytes = 0;

    try {
      if (useLocalStorage) {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith('pawdb_')) continue;
          const v = localStorage.getItem(k);
          total += (k.length + (v?.length || 0)) * 2;
        }
        totalBytes = total;
        filesCount = Object.keys(lsGet(LS_KEYS.FILE_INDEX, {})).length;
      } else {
        const files = await _getAllFiles();
        filesCount = files.length;
        // 粗略估算
        for (const f of files) {
          totalBytes += (f.data?.length || 0) * 1.5 + JSON.stringify(f).length * 2;
        }
        const articles = await _getAllArticles();
        for (const a of articles) {
          totalBytes += JSON.stringify(a).length * 2;
        }
      }
    } catch (e) {
      console.warn('[PawDB] 统计存储失败:', e);
    }

    let limitMB = 500;
    let hasRealEstimate = false;

    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage != null && estimate.quota != null) {
          totalBytes = estimate.usage;
          limitMB = Math.round(estimate.quota / 1024 / 1024);
          hasRealEstimate = true;
        }
      }
    } catch (e) { /* ignore */ }

    if (useLocalStorage) {
      limitMB = 5;
      hasRealEstimate = false;
    }

    return {
      bytes: totalBytes,
      kb: Math.round(totalBytes / 1024 * 10) / 10,
      mb: Math.round(totalBytes / 1024 / 1024 * 100) / 100,
      estimatedLimit: limitMB,
      articlesCount,
      filesCount,
      hasRealEstimate,
      isLegacy: useLocalStorage,
    };
  }

  // ========== 导入/导出 ==========
  async function exportAllData() {
    await ensureReady();
    const articles = await _getAllArticles();
    const files = await _getAllFiles();
    const admin = await _getAdmin();
    const settings = await _getAllSettings();
    return {
      version: 1,
      exportedAt: Date.now(),
      articles,
      files,
      admin,
      settings,
    };
  }

  async function importAllData(data, { clearFirst = true } = {}) {
    await ensureReady();
    if (clearFirst) {
      await _clearAll();
    }
    let ac = 0, fc = 0, sc = 0;
    if (data.articles && Array.isArray(data.articles)) {
      for (const a of data.articles) {
        try { await _saveArticleRaw(a); ac++; } catch (e) { console.warn('导入文章失败:', a.id, e); }
      }
    }
    if (data.files && Array.isArray(data.files)) {
      for (const f of data.files) {
        try { await _saveFileRaw(f); fc++; } catch (e) { console.warn('导入文件失败:', f.id, e); }
      }
    }
    if (data.admin) {
      try { await _saveAdminRaw(data.admin); } catch (e) { console.warn('导入管理员失败:', e); }
    }
    if (data.settings && typeof data.settings === 'object') {
      for (const [k, v] of Object.entries(data.settings)) {
        try { await _saveSettingRaw(k, v); sc++; } catch (e) { /* ignore */ }
      }
    }
    return { articles: ac, files: fc, settings: sc };
  }

  async function clearAllData() {
    await ensureReady();
    await _clearAll();
    sessionAdmin = null;
    await ensureDefaultData();
  }

  // 初始化完成后恢复会话
  init().then(() => {
    restoreSession().catch(() => { /* ignore */ });
  });

  // ========== 暴露 ==========
  return {
    init,
    ensureReady,
    get isLegacy() { return useLocalStorage; },
    get initError() { return initError; },

    genId,
    hashPassword,
    estimateReadingTime,
    extractExcerpt,
    formatFileSize,

    getArticles,
    getArticleById,
    searchArticles,
    getCategories,
    getAdjacentArticles,
    createArticle,
    updateArticle,
    deleteArticle,

    saveFile,
    getFileInfo,
    getFileData,
    getFilesByPostId,
    getAllFiles,
    setFilePostId,
    deleteFile,

    getAdmin,
    getAdminPublic,
    updateAdmin,
    verifyPassword,

    isLoggedIn,
    getCurrentAdmin,
    login,
    logout,

    getSetting,
    getAllSettings,
    putSetting,

    getStorageUsage,

    exportAllData,
    importAllData,
    clearAllData,
  };
})();

window.PawDB = PawDB;
