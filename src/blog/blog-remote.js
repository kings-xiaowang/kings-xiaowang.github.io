// PawBlog 远程数据源模块
// 负责：从远程 URL 加载数据、导出符合远程格式的 JSON、远程文章的文件查找

// 默认远程数据源 URL（内置 Gist，首次访问自动加载）
const DEFAULT_REMOTE_DATA_URL = 'https://gist.githubusercontent.com/kings-xiaowang/f8e401d793ecd23ddea9b0a7b7c95585/raw/bceb4a715f1c840b3a976242fdc4773424efad55/blog-data.json';

// 预设的 GitHub Token（仅用于预填输入框，需用户手动点击保存才会真正生效）
// 用户保存自己的 Token 后，此预设值不再使用
const PRESET_GITHUB_TOKEN = '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';

const PawRemote = (function () {
  const SETTING_KEY = 'remote_data_url';
  const LAST_SYNC_KEY = 'remote_last_sync';

  // 内存缓存的远程数据（公开页面使用）
  let remoteData = null;
  let remoteError = null;
  let remoteLoaded = false;
  let remoteLoadPromise = null;

  // ========== 设置相关 ==========
  // 获取当前生效的远程 URL（用户配置优先，否则用默认值）
  async function getEffectiveRemoteUrl() {
    try {
      const saved = await PawDB.getSetting(SETTING_KEY, '');
      if (saved && saved.startsWith('http')) return saved;
      return DEFAULT_REMOTE_DATA_URL;
    } catch (e) {
      return DEFAULT_REMOTE_DATA_URL;
    }
  }

  // 获取用户实际保存的 URL（空字符串表示未配置，使用默认值）
  async function getRemoteUrl() {
    try {
      return await PawDB.getSetting(SETTING_KEY, '');
    } catch (e) {
      return '';
    }
  }

  // 检查当前是否使用的是默认数据源
  async function isUsingDefault() {
    try {
      const saved = await PawDB.getSetting(SETTING_KEY, '');
      return !saved || !saved.startsWith('http');
    } catch (e) {
      return true;
    }
  }

  async function setRemoteUrl(url) {
    try {
      // 如果和默认值一样，存空字符串（表示使用默认），这样未来默认值更新时能自动跟随
      const normalized = url === DEFAULT_REMOTE_DATA_URL ? '' : (url || '');
      await PawDB.putSetting(SETTING_KEY, normalized);
      console.log('[PawRemote] 远程数据源 URL 已保存:', normalized || '(默认值)');
      return { success: true };
    } catch (e) {
      console.error('[PawRemote] 保存远程 URL 失败:', e);
      return { success: false, error: e.message || '保存失败' };
    }
  }

  function getDefaultRemoteUrl() {
    return DEFAULT_REMOTE_DATA_URL;
  }

  async function getLastSyncInfo() {
    try {
      return await PawDB.getSetting(LAST_SYNC_KEY, null);
    } catch (e) {
      return null;
    }
  }

  async function setLastSyncInfo(info) {
    try {
      await PawDB.putSetting(LAST_SYNC_KEY, info);
    } catch (e) { /* ignore */ }
  }

  // ========== 加载远程数据（公开页面入口） ==========
  function loadRemoteData({ force = false } = {}) {
    if (!force && remoteLoadPromise) return remoteLoadPromise;

    remoteLoadPromise = (async () => {
      remoteLoaded = false;
      remoteError = null;

      try {
        await PawDB.ensureReady();
        const url = await getEffectiveRemoteUrl();

        if (!url || !url.startsWith('http')) {
          remoteError = '未配置远程数据源';
          remoteData = null;
          remoteLoaded = true;
          return { success: false, error: remoteError, data: null };
        }

        // 直接 fetch，15 秒超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response;
        try {
          response = await fetch(url, { signal: controller.signal });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();

        // 基本格式校验
        if (!data || !Array.isArray(data.articles)) {
          throw new Error('数据格式不正确');
        }

        // 调试输出：加载到的文章数量和每篇标题
        console.log(`[PawRemote] 远程数据加载成功，共 ${data.articles.length} 篇文章：`);
        data.articles.forEach((a, i) => {
          console.log(`  [${i + 1}] ${a.title || '(无标题)'} (id: ${a.id})`);
        });

        remoteData = data;
        remoteLoaded = true;
        return { success: true, data, error: null };

      } catch (err) {
        let msg = err.message || '加载失败';
        if (err.name === 'AbortError') msg = '加载超时（15秒）';
        if (err instanceof SyntaxError) msg = 'JSON 解析失败';

        console.warn('[PawRemote] 远程数据加载失败:', msg);
        remoteError = msg;
        remoteData = null;
        remoteLoaded = true;
        return { success: false, error: msg, data: null };
      }
    })();

    return remoteLoadPromise;
  }

  function getRemoteData() {
    return remoteData;
  }

  function getRemoteError() {
    return remoteError;
  }

  function isRemoteLoaded() {
    return remoteLoaded;
  }

  function clearRemoteCache() {
    remoteData = null;
    remoteError = null;
    remoteLoaded = false;
    remoteLoadPromise = null;
  }

  // ========== 从远程数据获取文章 ==========
  function getRemoteArticles(onlyPublished = true) {
    if (!remoteData || !Array.isArray(remoteData.articles)) return [];
    let list = remoteData.articles;
    if (onlyPublished) {
      list = list.filter(a => a.published !== false);
    }
    // 兼容 createdAt 字段（可能是字符串时间戳）
    return list
      .map(a => normalizeRemoteArticle(a))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function getRemoteArticleById(id) {
    if (!remoteData || !Array.isArray(remoteData.articles)) return null;
    const raw = remoteData.articles.find(a => a.id === id);
    if (!raw) return null;
    return normalizeRemoteArticle(raw);
  }

  function getRemoteCategories() {
    const articles = getRemoteArticles(true);
    const cats = new Set(articles.map(a => a.category).filter(Boolean));
    return Array.from(cats);
  }

  function getRemoteAdjacentArticles(id) {
    const articles = getRemoteArticles(true);
    const idx = articles.findIndex(a => a.id === id);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? articles[idx - 1] : null,
      next: idx < articles.length - 1 ? articles[idx + 1] : null,
    };
  }

  function searchRemoteArticles(query, onlyPublished = true) {
    const articles = getRemoteArticles(onlyPublished);
    if (!query || !query.trim()) return articles;
    const q = query.toLowerCase().trim();
    return articles.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // 返回站点配置（始终使用硬编码值，不被远程数据覆盖）
  function getRemoteBlogInfo() {
    // 博客名称、博主信息统一使用硬编码配置，不读取远程数据中的 blog 字段
    // 防止 Gist 里的旧数据（PawBlog / 狐小爪）覆盖当前站点信息
    return getSiteBlogInfo();
  }

  // 规范化远程文章字段（兼容命名差异）
  function normalizeRemoteArticle(raw) {
    return {
      id: raw.id,
      title: raw.title || '',
      excerpt: raw.excerpt || raw.summary || PawDB.extractExcerpt(raw.content || ''),
      content: raw.content || '',
      category: raw.category || '随笔',
      tags: raw.tags || [],
      createdAt: toTimestamp(raw.createdAt),
      updatedAt: toTimestamp(raw.updatedAt || raw.createdAt),
      published: raw.published !== false,
      // 远程数据里文件嵌入在文章对象中
      files: Array.isArray(raw.files) ? raw.files : [],
    };
  }

  function toTimestamp(val) {
    if (!val) return Date.now();
    if (typeof val === 'number') return val;
    const t = new Date(val).getTime();
    return isNaN(t) ? Date.now() : t;
  }

  // ========== 导出远程格式 JSON ==========
  async function exportRemoteFormat() {
    await PawDB.ensureReady();

    const articles = await PawDB.getArticles(false); // 全部（含草稿）
    // 博客名称和博主信息使用硬编码配置，不读取本地 DB 中的值
    const siteInfo = getSiteBlogInfo();
    const siteName = siteInfo.title;
    const siteSubtitle = siteInfo.subtitle;
    const authorInfo = getSiteAuthorPublic();

    // 每篇文章附带其文件
    const articlesWithFiles = [];
    for (const article of articles) {
      const files = await PawDB.getFilesByPostId(article.id);
      const fileDetails = [];
      for (const finfo of files) {
        const data = await PawDB.getFileData(finfo.id);
        fileDetails.push({
          id: finfo.id,
          name: finfo.name,
          type: finfo.type,
          kind: finfo.kind,
          size: finfo.size,
          data: data || '',
        });
      }
      articlesWithFiles.push({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        summary: article.excerpt, // 兼容字段
        content: article.content,
        category: article.category,
        tags: article.tags,
        createdAt: new Date(article.createdAt).toISOString(),
        updatedAt: new Date(article.updatedAt).toISOString(),
        published: article.published,
        files: fileDetails,
      });
    }

    // 社交链接
    const socialLinks = [];
    if (authorInfo.github) socialLinks.push({ name: 'GitHub', url: authorInfo.github });
    if (authorInfo.blog) socialLinks.push({ name: '博客', url: 'https://' + authorInfo.blog });
    if (authorInfo.email) socialLinks.push({ name: '邮箱', url: 'mailto:' + authorInfo.email });

    const result = {
      version: 1,
      exportedAt: new Date().toISOString(),
      blog: {
        title: siteName,
        subtitle: siteSubtitle,
        author: authorInfo.nickname,
        avatar: authorInfo.avatar,
        bio: authorInfo.bio,
        location: authorInfo.location,
        email: authorInfo.email,
        socialLinks,
      },
      articles: articlesWithFiles,
    };

    return result;
  }

  // ========== 把远程数据同步到本地 IndexedDB ==========
  // 把远程数据同步到本地 IndexedDB
  // 只同步文章和文件，博主信息和博客名称使用硬编码配置，不被远程数据覆盖
  async function syncRemoteToLocal(remoteDataObj) {
    await PawDB.ensureReady();
    const data = remoteDataObj || remoteData;
    if (!data || !Array.isArray(data.articles)) {
      throw new Error('远程数据为空或格式不正确');
    }

    // 1. 清空现有文章和文件
    await PawDB.clearArticlesAndFiles();

    // 2. 导入文章和文件
    let articleCount = 0;
    let fileCount = 0;

    for (const raw of data.articles) {
      const article = normalizeRemoteArticle(raw);
      await PawDB.saveArticleRaw(article);
      articleCount++;
      // 保存文件
      const files = Array.isArray(raw.files) ? raw.files : [];
      for (const f of files) {
        try {
          await PawDB.saveFileRaw({
            id: f.id,
            name: f.name || '未命名文件',
            type: f.type || 'application/octet-stream',
            kind: f.kind || 'file',
            size: f.size || 0,
            postId: article.id,
            uploadedAt: Date.now(),
            data: f.data || '',
          });
          fileCount++;
        } catch (e) { console.warn('同步文件失败:', f.id, e.message); }
      }
    }

    // 注意：博主信息和博客名称使用硬编码配置（见 blog-config.js）
    // 不再从远程数据中读取并覆盖，防止旧数据污染

    return { articleCount, fileCount, author: SITE_CONFIG.author.nickname };
  }

  // ========== 远程文件解析 ==========
  // 从文章的 files 数组中查找 fileId 对应的文件信息和 base64 数据
  function findFileInArticle(article, fileId) {
    if (!article || !article.files || !Array.isArray(article.files)) return null;
    return article.files.find(f => f.id === fileId) || null;
  }

  // 解析容器中的 file: 引用，从传入的文章 files 中找
  // 用于远程数据的文章详情页（文件数据在文章对象里，不在 IndexedDB）
  async function resolveRemoteFileElements(container, article) {
    if (!container || !article) return;
    const els = container.querySelectorAll('[data-blog-file]');
    if (els.length === 0) return;

    for (const el of els) {
      const fileId = el.getAttribute('data-blog-file');
      if (!fileId) continue;

      const file = findFileInArticle(article, fileId);
      if (!file) {
        el.style.opacity = '0.4';
        if (el.tagName === 'IMG') {
          el.alt = (el.alt || '图片') + '（未找到）';
        }
        continue;
      }

      const data = file.data || '';
      const type = file.type || 'application/octet-stream';
      const dataUrl = data.startsWith('data:') ? data : 'data:' + type + ';base64,' + data;

      if (el.tagName === 'IMG') {
        el.src = dataUrl;
        el.setAttribute('data-lightbox-src', dataUrl);
      } else if (el.tagName === 'A') {
        el.href = dataUrl;
        const sizeText = PawDB.formatFileSize(file.size || 0);
        if (el.textContent.indexOf(sizeText) === -1) {
          el.textContent = el.textContent + ' (' + sizeText + ')';
        }
      }
    }
  }

  // ========== Gist 自动同步 ==========

  // Token 存储 key
  const SETTING_GITHUB_TOKEN = 'github_gist_token';
  const SETTING_LAST_PUSH_GIST = 'last_push_to_gist';
  const SETTING_AUTO_SYNC_GIST = 'auto_sync_gist';

  async function getGithubToken() {
    try { return (await PawDB.getSetting(SETTING_GITHUB_TOKEN, '')) || ''; } catch (e) { return ''; }
  }

  async function setGithubToken(token) {
    try {
      await PawDB.putSetting(SETTING_GITHUB_TOKEN, token || '');
      console.log('[PawRemote] GitHub Token 已保存:', token ? '已配置' : '已清空');
      return { success: true };
    } catch (e) {
      console.error('[PawRemote] 保存 GitHub Token 失败:', e);
      return { success: false, error: e.message || '保存失败' };
    }
  }

  async function clearGithubToken() {
    return setGithubToken('');
  }

  async function hasGithubToken() {
    const t = await getGithubToken();
    return !!t;
  }

  async function getAutoSyncEnabled() {
    try {
      const val = await PawDB.getSetting(SETTING_AUTO_SYNC_GIST, null);
      if (val === null || val === undefined) {
        // 首次使用，默认开启（仅当数据源 URL 是 Gist 时才有意义）
        return true;
      }
      return !!val;
    } catch (e) { return true; }
  }

  async function setAutoSyncEnabled(enabled) {
    return PawDB.putSetting(SETTING_AUTO_SYNC_GIST, !!enabled);
  }

  // 返回预设 Token（仅用于预填输入框，不作为实际使用的 Token）
  function getPresetGithubToken() {
    return PRESET_GITHUB_TOKEN || '';
  }

  // 自动同步默认是否开启（首次使用时默认开启）
  function getAutoSyncDefaultOn() {
    return true;
  }

  async function getLastPushToGist() {
    try { return await PawDB.getSetting(SETTING_LAST_PUSH_GIST, null); } catch (e) { return null; }
  }

  async function setLastPushToGist(info) {
    return PawDB.putSetting(SETTING_LAST_PUSH_GIST, info);
  }

  // 从 Gist raw URL 中提取 gistId 和 filename
  // 格式：https://gist.githubusercontent.com/{user}/{gistId}/raw/{revision}/{filename}
  // 也兼容：https://gist.githubusercontent.com/{user}/{gistId}/raw/{filename}
  function parseGistUrl(url) {
    if (!url) return { gistId: null, filename: null, isValid: false };
    try {
      const u = new URL(url);
      if (u.hostname !== 'gist.githubusercontent.com') {
        return { gistId: null, filename: null, isValid: false };
      }
      const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean);
      // parts: [username, gistId, raw, revision?, filename]
      if (parts.length < 4 || parts[2] !== 'raw') {
        return { gistId: null, filename: null, isValid: false };
      }
      const gistId = parts[1];
      const filename = decodeURIComponent(parts[parts.length - 1]);
      return { gistId, filename, isValid: true };
    } catch (e) {
      return { gistId: null, filename: null, isValid: false };
    }
  }

  // 获取当前 Gist 信息（从配置的远程 URL 解析）
  async function getGistInfo() {
    const url = await getRemoteUrl();
    const parsed = parseGistUrl(url);
    return {
      url,
      gistId: parsed.gistId,
      filename: parsed.filename,
      isValid: parsed.isValid,
      gistPageUrl: parsed.gistId
        ? `https://gist.github.com/${parsed.gistId}`
        : null,
    };
  }

  // 计算有多少文章未同步到 Gist（基于 updatedAt 对比上次推送时间）
  async function getUnsavedArticleCount() {
    try {
      const lastPush = await getLastPushToGist();
      const lastTime = lastPush?.pushedAt || 0;
      const articles = await PawDB.getArticles(true); // 已发布
      const unsynced = articles.filter(a => (a.updatedAt || a.createdAt || 0) > lastTime);
      return { count: unsynced.length, lastPushedAt: lastTime };
    } catch (e) {
      return { count: 0, lastPushedAt: 0, error: e.message };
    }
  }

  // 同步当前本地数据到 Gist
  async function syncToGist(options = {}) {
    const token = await getGithubToken();
    if (!token) {
      throw new Error('尚未配置 GitHub Token');
    }

    const gistInfo = await getGistInfo();
    if (!gistInfo.gistId || !gistInfo.filename) {
      throw new Error('无法从当前数据源 URL 提取 Gist ID 和文件名，请检查数据源设置');
    }

    // 导出当前数据
    const data = await exportRemoteFormat();
    const jsonStr = JSON.stringify(data, null, 2);

    // 15 秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const resp = await fetch(`https://api.github.com/gists/${gistInfo.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description: `PawBlog data - ${new Date().toLocaleString()}`,
          files: {
            [gistInfo.filename]: {
              content: jsonStr,
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errData = await resp.json();
          if (errData.message) errMsg = errData.message;
        } catch (_) { /* ignore */ }
        throw new Error(`GitHub API 错误：${errMsg}`);
      }

      // 同步成功，记录时间
      const pushInfo = {
        pushedAt: Date.now(),
        gistId: gistInfo.gistId,
        filename: gistInfo.filename,
        articleCount: data.articles?.length || 0,
        status: 'success',
      };
      await setLastPushToGist(pushInfo);

      // 同步成功后立即刷新远程缓存，确保首页等公开页面下次读取到最新数据
      try {
        clearRemoteCache();
        await loadRemoteData({ force: true });
        console.log(`[PawRemote] 同步到 Gist 成功，已刷新本地缓存，共 ${pushInfo.articleCount} 篇文章`);
      } catch (refreshErr) {
        console.warn('[PawRemote] 同步成功，但刷新缓存失败:', refreshErr);
      }

      return pushInfo;
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error('同步超时（15 秒），请检查网络连接');
      }
      throw e;
    }
  }

  return {
    // 设置
    getRemoteUrl,
    getEffectiveRemoteUrl,
    getDefaultRemoteUrl,
    isUsingDefault,
    setRemoteUrl,
    getLastSyncInfo,
    setLastSyncInfo,

    // 加载远程数据
    loadRemoteData,
    getRemoteData,
    getRemoteError,
    isRemoteLoaded,
    clearRemoteCache,

    // 远程数据查询
    getRemoteArticles,
    getRemoteArticleById,
    getRemoteCategories,
    getRemoteAdjacentArticles,
    searchRemoteArticles,
    getRemoteBlogInfo,

    // 导出
    exportRemoteFormat,

    // 同步
    syncRemoteToLocal,

    // 远程文件解析
    findFileInArticle,
    resolveRemoteFileElements,

    // ========== Gist 自动同步 ==========
    // GitHub Token 管理
    getGithubToken,
    setGithubToken,
    clearGithubToken,
    hasGithubToken,

    // Gist 信息解析
    parseGistUrl,
    getGistInfo,
    getPresetGithubToken,

    // 同步到 Gist
    syncToGist,
    getLastPushToGist,
    getUnsavedArticleCount,
    setAutoSyncEnabled,
    getAutoSyncEnabled,
    getAutoSyncDefaultOn,
  };
})();

window.PawRemote = PawRemote;
