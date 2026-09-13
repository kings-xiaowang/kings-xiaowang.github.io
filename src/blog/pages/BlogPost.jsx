// PawBlog 文章详情页（支持远程数据）

function BlogPostPage({ postId, onNavigate, usingRemote }) {
  const [post, setPost] = React.useState(null);
  const [adjacent, setAdjacent] = React.useState({ prev: null, next: null });
  const [notFound, setNotFound] = React.useState(false);
  const [admin, setAdmin] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    loadPost();
  }, [postId, usingRemote]);

  React.useEffect(() => {
    if (post && contentRef.current) {
      if (usingRemote) {
        // 远程数据：从文章本身的 files 数组里找
        PawRemote.resolveRemoteFileElements(contentRef.current, post);
      } else {
        // 本地数据：从 IndexedDB 找
        blogResolveFileElements(contentRef.current);
      }
    }
  }, [post, usingRemote]);

  const loadPost = async () => {
    setLoading(true);
    try {
      if (usingRemote) {
        const p = PawRemote.getRemoteArticleById(postId);
        if (!p || p.published === false) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setPost(p);
        setAdjacent(PawRemote.getRemoteAdjacentArticles(postId));
        const info = PawRemote.getRemoteBlogInfo();
        setAdmin({
          nickname: info?.author || '小狐狸',
          avatar: info?.avatar || 'preset:fox',
          bio: info?.bio || '',
        });
      } else {
        await PawDB.ensureReady();
        const p = await PawDB.getArticleById(postId);
        if (!p || p.published === false) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setPost(p);
        setAdjacent(await PawDB.getAdjacentArticles(postId));
        setAdmin(await PawDB.getAdminPublic());
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.warn('[BlogPost] 加载失败:', e);
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
          {blogGetAvatarEmoji(admin?.avatar)}
        </div>
        <div className="blog-author-info">
          <div className="blog-author-name">{admin?.nickname || 'kings小wang'}</div>
          <div className="blog-author-bio">
            {admin?.bio || '一只热爱代码和毛茸茸文化的小狐狸。'}
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
