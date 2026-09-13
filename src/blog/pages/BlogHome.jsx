// PawBlog 首页（支持远程数据）

function BlogHomePage({ onNavigate, usingRemote }) {
  const [posts, setPosts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  // 博主信息使用硬编码配置，不被远程数据覆盖
  const admin = getSiteAuthorPublic();
  // 站点名称和副标题使用硬编码配置
  const siteName = SITE_CONFIG.siteName;
  const siteSubtitle = SITE_CONFIG.siteSubtitle;

  React.useEffect(() => {
    loadData();
  }, [usingRemote]);

  const loadData = async () => {
    setLoading(true);
    try {
      await PawDB.ensureReady();

      if (usingRemote) {
        setPosts(PawRemote.getRemoteArticles(true));
        setCategories(PawRemote.getRemoteCategories());
      } else {
        const allPosts = await PawDB.getArticles(true);
        setPosts(allPosts.sort((a, b) => b.createdAt - a.createdAt));
        setCategories(await PawDB.getCategories());
      }
    } catch (e) {
      console.warn('[BlogHome] 加载失败:', e);
    } finally {
      setLoading(false);
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

      {filteredPosts.length === 0 ? (
        <div className="blog-empty">
          <div className="blog-empty-emoji">🦊</div>
          <div className="blog-empty-title">
            {searchQuery ? '没有找到相关文章' : '还没有文章哦'}
          </div>
          <div className="blog-empty-desc">
            {searchQuery ? '试试其他关键词吧～' : '小wang正在准备第一篇文章...'}
          </div>
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
                <h2 className="blog-post-title">{post.title}</h2>
              </div>
              <div className="blog-post-meta">
                <span className="blog-post-meta-item">
                  <BlogCalendarIcon size={14} />
                  {blogFormatDate(post.createdAt)}
                </span>
                <span className="blog-post-meta-item">
                  <BlogClockIcon size={14} />
                  {PawDB.estimateReadingTime(post.content)} 分钟阅读
                </span>
                <span className="blog-post-meta-item">
                  <BlogTagIcon size={14} />
                  {post.category}
                </span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="blog-post-tags">
                  {post.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="blog-post-tag">#{tag}</span>
                  ))}
                </div>
              )}
              <p className="blog-post-excerpt">{post.excerpt}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

window.BlogHomePage = BlogHomePage;
