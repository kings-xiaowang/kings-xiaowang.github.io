// PawBlog 首页（支持远程数据，优先远程→本地降级→空状态）

function BlogHomePage({ onNavigate, usingRemote }) {
  const [posts, setPosts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');
  const [dataSource, setDataSource] = React.useState('remote'); // remote / local / empty
  // 博主信息使用硬编码配置，不被远程数据覆盖
  const admin = getSiteAuthorPublic();
  // 站点名称和副标题使用硬编码配置
  const siteName = SITE_CONFIG.siteName;
  const siteSubtitle = SITE_CONFIG.siteSubtitle;

  React.useEffect(() => {
    loadData();
  }, [usingRemote]);

  const loadFromRemote = async () => {
    const result = await PawRemote.loadRemoteData({ force: false });
    if (result.success && result.data && Array.isArray(result.data.articles)) {
      const articles = PawRemote.getRemoteArticles(true);
      const cats = PawRemote.getRemoteCategories();
      console.log(`[BlogHome] 从远程 Gist 加载了 ${articles.length} 篇文章，${cats.length} 个分类`);
      setPosts(articles);
      setCategories(cats);
      setDataSource('remote');
      setLoadError('');
      return true;
    }
    return false;
  };

  const loadFromLocal = async () => {
    try {
      const allPosts = await PawDB.getArticles(true);
      const sorted = allPosts.sort((a, b) => b.createdAt - a.createdAt);
      const cats = await PawDB.getCategories();
      console.log(`[BlogHome] 从本地 IndexedDB 加载了 ${sorted.length} 篇文章，${cats.length} 个分类`);
      setPosts(sorted);
      setCategories(cats);
      setDataSource(sorted.length > 0 ? 'local' : 'empty');
      setLoadError('');
      return true;
    } catch (e) {
      console.warn('[BlogHome] 本地加载失败:', e);
      return false;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      await PawDB.ensureReady();

      // 优先从远程加载
      const remoteOk = await loadFromRemote();
      if (!remoteOk) {
        // 远程失败，降级到本地
        console.warn('[BlogHome] 远程加载失败，降级到本地 IndexedDB');
        const localOk = await loadFromLocal();
        if (!localOk) {
          setDataSource('empty');
          setLoadError('加载失败，请稍后重试');
        }
      }
    } catch (e) {
      console.warn('[BlogHome] 加载失败:', e);
      setLoadError(e.message || '加载失败');
      // 尝试本地降级
      try {
        await loadFromLocal();
      } catch (_) {
        setDataSource('empty');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoadError('');
    try {
      PawRemote.clearRemoteCache();
      const result = await PawRemote.loadRemoteData({ force: true });
      if (result.success && result.data && Array.isArray(result.data.articles)) {
        const articles = PawRemote.getRemoteArticles(true);
        const cats = PawRemote.getRemoteCategories();
        setPosts(articles);
        setCategories(cats);
        setDataSource('remote');
        blogShowToast(`已从 Gist 加载 ${articles.length} 篇文章`, 'success');
      } else {
        throw new Error(result.error || '远程数据加载失败');
      }
    } catch (e) {
      console.warn('[BlogHome] 刷新失败:', e);
      setLoadError(e.message || '刷新失败');
      blogShowToast('刷新失败：' + e.message, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPosts = React.useMemo(() => {
    let list = posts;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [posts, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="blog-page">
        <div className="blog-remote-loading">
          <div className="paw">🐾</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div className="blog-hero-avatar">
          {blogGetAvatarEmoji(admin.avatar)}
        </div>
        <h1 className="blog-hero-title">{siteName}</h1>
        <p className="blog-hero-subtitle">{siteSubtitle}</p>
        <div className="blog-hero-author">
          <BlogPawIcon size={14} />
          <span>{admin.nickname}</span>
        </div>
      </section>

      <div className="blog-filter-bar">
        <div className="blog-search-box">
          <span className="blog-search-icon">
            <BlogSearchIcon size={18} />
          </span>
          <input
            type="text"
            className="blog-search-input"
            placeholder="搜索文章..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="blog-btn blog-btn-ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            title="从 Gist 重新加载文章"
            style={{
              padding: '8px 14px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ display: 'inline-flex', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            {refreshing ? '加载中...' : '刷新文章'}
          </button>
          <div className="blog-category-chips">
            <button
              className={`blog-category-chip ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`blog-category-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 数据源提示 */}
      {loadError && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          backgroundColor: 'var(--blog-cream-100)',
          border: '1px solid var(--blog-caramel-300)',
          borderRadius: 12,
          fontSize: 13,
          color: 'var(--blog-caramel-700)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>⚠</span>
          <span>远程数据加载失败：{loadError}，当前显示{dataSource === 'local' ? '本地数据' : '缓存数据'}</span>
        </div>
      )}

      {/* 文章数量 & 数据源标签 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8
      }}>
        <div style={{ fontSize: 13, color: 'var(--blog-text-secondary)' }}>
          共 <strong style={{ color: 'var(--blog-text-primary)' }}>{filteredPosts.length}</strong> 篇文章
        </div>
        {dataSource === 'remote' && (
          <span style={{
            fontSize: 12,
            padding: '3px 10px',
            backgroundColor: 'var(--blog-forest-50)',
            color: 'var(--blog-forest-700)',
            borderRadius: 20,
            border: '1px solid var(--blog-forest-200)'
          }}>
            ☁️ 来自 Gist
          </span>
        )}
        {dataSource === 'local' && (
          <span style={{
            fontSize: 12,
            padding: '3px 10px',
            backgroundColor: 'var(--blog-lavender-50)',
            color: 'var(--blog-lavender-700)',
            borderRadius: 20,
            border: '1px solid var(--blog-lavender-200)'
          }}>
            💾 本地数据
          </span>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="blog-empty">
          <div className="blog-empty-emoji">🦊</div>
          <div className="blog-empty-title">
            {searchQuery ? '没有找到相关文章' : '还没有文章哦'}
          </div>
          <div className="blog-empty-desc">
            {searchQuery ? '试试其他关键词吧～' : '小wang正在准备第一篇文章...'}
          </div>
          {!searchQuery && dataSource === 'remote' && (
            <button
              className="blog-btn blog-btn-primary"
              onClick={handleRefresh}
              style={{ marginTop: 16 }}
            >
              🔄 重新加载
            </button>
          )}
        </div>
      ) : (
        <div className="blog-post-list">
          {filteredPosts.map(post => (
            <article
              key={post.id}
              className="blog-post-card"
              onClick={() => onNavigate('post', { id: post.id })}
            >
              <div className="blog-post-card-header">
                <h2 className="blog-post-title">{post.title || '(无标题)'}</h2>
              </div>
              <div className="blog-post-meta">
                <span className="blog-post-meta-item">
                  <BlogCalendarIcon size={14} />
                  {blogFormatDate(post.createdAt)}
                </span>
                <span className="blog-post-meta-item">
                  <BlogClockIcon size={14} />
                  {PawDB.estimateReadingTime(post.content || '')} 分钟阅读
                </span>
                <span className="blog-post-meta-item">
                  <BlogTagIcon size={14} />
                  {post.category || '随笔'}
                </span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="blog-post-tags">
                  {post.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="blog-post-tag">#{tag}</span>
                  ))}
                </div>
              )}
              <p className="blog-post-excerpt">{post.excerpt || ''}</p>
            </article>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

window.BlogHomePage = BlogHomePage;
