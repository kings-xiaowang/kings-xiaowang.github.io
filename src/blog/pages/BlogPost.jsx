// PawBlog 文章详情页（支持远程数据）

function BlogPostPage({ postId, onNavigate, usingRemote }) {
  const [post, setPost] = React.useState(null);
  const [adjacent, setAdjacent] = React.useState({ prev: null, next: null });
  const [notFound, setNotFound] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const contentRef = React.useRef(null);
  // 博主信息使用硬编码配置，不被远程数据覆盖
  const admin = getSiteAuthorPublic();

  React.useEffect(() => {
    loadPost();
  }, [postId, usingRemote]);

  React.useEffect(() => {
    if (post && contentRef.current) {
      // 文章对象带 files 数组 → 远程数据来源
      if (Array.isArray(post.files) && post.files.length > 0) {
        PawRemote.resolveRemoteFileElements(contentRef.current, post);
      } else {
        // 本地数据：从 IndexedDB 找
        blogResolveFileElements(contentRef.current);
      }
    }
  }, [post]);

  const loadPost = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      await PawDB.ensureReady();

      let p = null;
      let adj = { prev: null, next: null };
      let foundRemote = false;

      // 优先从远程加载
      try {
        // 确保远程数据已加载（有缓存就用缓存，没有就拉一次）
        await PawRemote.loadRemoteData({ force: false });
        p = PawRemote.getRemoteArticleById(postId);
        if (p && p.published !== false) {
          adj = PawRemote.getRemoteAdjacentArticles(postId);
          foundRemote = true;
          console.log(`[BlogPost] 从远程 Gist 加载文章: ${p.title}`);
        }
      } catch (remoteErr) {
        console.warn('[BlogPost] 远程加载失败，尝试本地:', remoteErr.message);
      }

      // 远程没找到，降级到本地
      if (!foundRemote) {
        p = await PawDB.getArticleById(postId);
        if (p && p.published !== false) {
          adj = await PawDB.getAdjacentArticles(postId);
          console.log(`[BlogPost] 从本地 IndexedDB 加载文章: ${p.title}`);
        } else {
          p = null;
        }
      }

      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(p);
      setAdjacent(adj);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.warn('[BlogPost] 加载失败:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

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

  if (notFound) {
    return (
      <div className="blog-page">
        <div className="blog-empty" style={{ paddingTop: 80 }}>
          <div className="blog-empty-emoji">🦊❓</div>
          <div className="blog-empty-title">文章走丢了</div>
          <div className="blog-empty-desc">这篇文章可能已经被删除或不存在</div>
          <div style={{ marginTop: 24 }}>
            <button className="blog-btn blog-btn-primary" onClick={() => onNavigate('home')}>
              <BlogHomeIcon size={16} /> 返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="blog-page blog-post-detail">
      <nav className="blog-breadcrumb">
        <span className="blog-breadcrumb-link" onClick={() => onNavigate('home')}>
          首页
        </span>
        <BlogChevronRightIcon size={12} />
        <span className="blog-breadcrumb-link" onClick={() => onNavigate('home')}>
          {post.category}
        </span>
        <BlogChevronRightIcon size={12} />
        <span style={{ color: 'var(--blog-text-primary)', fontWeight: 500 }}>
          {post.title.length > 20 ? post.title.slice(0, 20) + '…' : post.title}
        </span>
      </nav>

      <h1 className="blog-post-detail-title">{post.title}</h1>

      <div className="blog-post-detail-meta">
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
        {post.tags && post.tags.map(tag => (
          <span key={tag} className="blog-post-tag">#{tag}</span>
        ))}
      </div>

      <article
        ref={contentRef}
        className="blog-md-content"
        dangerouslySetInnerHTML={{ __html: blogRenderMarkdown(post.content) }}
      />

      <div className="blog-author-card">
            <div className="blog-author-avatar">
              {blogGetAvatarEmoji(admin.avatar)}
            </div>
        <div className="blog-author-info">
          <div className="blog-author-name">{admin.nickname}</div>
          <div className="blog-author-bio">
            {admin.bio}
          </div>
        </div>
      </div>

      {(adjacent.prev || adjacent.next) && (
        <div className="blog-post-nav">
          {adjacent.prev ? (
            <div
              className="blog-post-nav-item prev"
              onClick={() => onNavigate('post', { id: adjacent.prev.id })}
            >
              <div className="blog-post-nav-label">
                <BlogChevronLeftIcon size={14} />
                上一篇
              </div>
              <div className="blog-post-nav-title">{adjacent.prev.title}</div>
            </div>
          ) : <div />}
          {adjacent.next ? (
            <div
              className="blog-post-nav-item next"
              onClick={() => onNavigate('post', { id: adjacent.next.id })}
            >
              <div className="blog-post-nav-label">
                下一篇
                <BlogChevronRightIcon size={14} />
              </div>
              <div className="blog-post-nav-title">{adjacent.next.title}</div>
            </div>
          ) : <div />}
        </div>
      )}

      <div className="blog-back-home-wrap">
        <button className="blog-back-home" onClick={() => onNavigate('home')}>
          <BlogArrowLeftIcon size={16} />
          返回首页
        </button>
      </div>
    </div>
  );
}

window.BlogPostPage = BlogPostPage;
