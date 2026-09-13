// PawBlog 远程数据源模块
// 负责：从远程 URL 加载数据、导出符合远程格式的 JSON、远程文章的文件查找

// 默认远程数据源 URL（内置 Gist，首次访问自动加载）
  const DEFAULT_REMOTE_DATA_URL = 'https://gist.githubusercontent.com/kings-xiaowang/f8e401d793ecd23ddea9b0a7b7c95585/raw/bceb4a715f1c840b3a976242fdc4773424efad55/blog-data.json';

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
      return true;
    } catch (e) {
      return false;
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

        // fetch 带 10 秒超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let response;
        try {
          response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-cache',
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        // 基本格式校验
        if (!data || !Array.isArray(data.articles)) {
          throw new Error('数据格式不正确');
        }

        remoteData = data;
        remoteLoaded = true;
        return { success: true, data, error: null };

      } catch (err) {
        let msg = err.message || '加载失败';
        if (err.name === 'AbortError') msg = '加载超时（10秒）';
        if (err instanceof SyntaxError) msg = 'JSON 解析失败';

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

  function getRemoteBlogInfo() {
    if (!remoteData) return null;
    const b = remoteData.blog || {};
    return {
      title: b.title || 'kings小wang的个人博客',
      subtitle: b.subtitle || '',
      author: b.author || '小狐狸',
      avatar: b.avatar || 'preset:fox',
      bio: b.bio || '',
      location: b.location || '',
      email: b.email || '',
      socialLinks: b.socialLinks || [],
    };
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
    const admin = await PawDB.getAdminPublic();
    const siteName = await PawDB.getSetting('siteName', 'kings小wang的个人博客');
    const siteSubtitle = await PawDB.getSetting('siteSubtitle', '');

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
    if (admin?.github) socialLinks.push({ name: 'GitHub', url: admin.github });
    if (admin?.blog) socialLinks.push({ name: '博客', url: 'https://' + admin.blog });
    if (admin?.email) socialLinks.push({ name: '邮箱', url: 'mailto:' + admin.email });

    const result = {
      version: 1,
      exportedAt: new Date().toISOString(),
      blog: {
        title: siteName,
        subtitle: siteSubtitle,
        author: admin?.nickname || 'kings小wang',
        avatar: admin?.avatar || 'preset:fox',
        bio: admin?.bio || '',
        location: admin?.location || '',
        email: admin?.email || '',
        socialLinks,
      },
      articles: articlesWithFiles,
    };

    return result;
  }

  // ========== 远程文章的文件查找 ==========
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

    // 远程文件解析
    findFileInArticle,
    resolveRemoteFileElements,
  };
})();

window.PawRemote = PawRemote;
