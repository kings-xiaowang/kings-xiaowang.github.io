// 最新动态时间线页

function FeedPage({ onViewDetail, onViewProfile, user, starredProjects, onToggleStar, onOpenLogin }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [offset, setOffset] = React.useState(0);

  const loadFeed = (reset = false) => {
    if (reset) setLoading(true);
    FeedAPI.get({ limit: 10, offset: reset ? 0 : offset }).then(data => {
      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setOffset(prev => reset ? 10 : prev + 10);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  React.useEffect(() => {
    loadFeed(true);
  }, []);

  return (
    <div>
      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-forest-100) 0%, var(--color-cream-100) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 24,
        border: '2px solid var(--color-forest-200)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -10, right: 20,
          fontSize: 80, opacity: 0.1,
        }}>🌟</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24, fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 6,
        }}>
          <ActivityIcon size={22} color="var(--color-forest-600)" />
          {' '}最新动态
        </h1>
        <p style={{
          fontSize: 13, color: 'var(--color-text-secondary)',
          margin: 0, maxWidth: 500,
        }}>
          看看社区里最新发布的项目，发现有趣的创作者和作品
        </p>
      </div>

      {/* 动态列表 */}
      {loading && items.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          <PawIcon size={28} color="var(--color-caramel-400)" />
          <div style={{ marginTop: 10, fontSize: 14 }}>加载中...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((project, idx) => (
            <div
              key={project.id}
              style={{
                display: 'flex', gap: 16,
                padding: '18px 20px',
                background: 'var(--color-bg-card)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-caramel-300)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => onViewDetail(project.id)}
            >
              {/* 时间轴点 */}
              <div style={{
                width: 40, display: 'flex', flexDirection: 'column',
                alignItems: 'center', flexShrink: 0,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--color-caramel-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid var(--color-cream-100)',
                }}>
                  {getProjectIcon(project.icon, 16, 'var(--color-caramel-600)')}
                </div>
                {idx < items.length - 1 && (
                  <div style={{
                    width: 2, flex: 1,
                    background: 'var(--color-border)',
                    marginTop: 4,
                  }}></div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* 头部：发布者 + 时间 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 6,
                }}>
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: '50%', overflow: 'hidden',
                      background: 'var(--color-caramel-200)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile && onViewProfile(project.owner?.username);
                    }}
                  >
                    {project.owner?.avatar ? (
                      <img src={project.owner.avatar} alt={project.owner.username}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 600, color: 'var(--color-caramel-600)',
                        fontFamily: 'var(--font-display)',
                      }}>{project.owner?.username?.[0]?.toUpperCase()}</div>
                    )}
                  </div>
                  <span
                    style={{
                      fontWeight: 600, fontSize: 13, color: 'var(--color-caramel-700)',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile && onViewProfile(project.owner?.username);
                    }}
                  >
                    {project.owner?.username}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                    发布了新项目
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-tertiary)',
                  }}>
                    {formatDate(project.createdAt)}
                  </span>
                </div>

                {/* 项目标题 */}
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 17, fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 4,
                }}>
                  {project.name}
                </div>

                {/* 项目简介 */}
                <p style={{
                  fontSize: 13, color: 'var(--color-text-secondary)',
                  marginBottom: 10, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{project.desc}</p>

                {/* 标签 + 统计 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {project.topics && project.topics.slice(0, 3).map(topic => (
                    <span key={topic} className="topic-tag" style={{ fontSize: 11 }}>#{topic}</span>
                  ))}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: 'var(--color-text-tertiary)',
                    }}>
                      <span className="lang-dot" style={{ background: project.langColor }}></span>
                      {project.language}
                    </span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: 'var(--color-text-tertiary)',
                    }}>
                      <StarIcon size={12} color="currentColor" />
                      {project.stars}
                    </span>
                    <button
                      className={`repo-card-star-btn ${starredProjects.includes(project.id) ? 'starred' : ''}`}
                      style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) { onOpenLogin(); return; }
                        onToggleStar(project.id);
                      }}
                    >
                      <StarIcon size={12} color="currentColor" filled={starredProjects.includes(project.id)} />
                      {starredProjects.includes(project.id) ? '已收藏' : '收藏'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加载更多 */}
      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className="btn btn-secondary"
            onClick={() => loadFeed(false)}
          >
            加载更多
          </button>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div style={{
          textAlign: 'center', marginTop: 24,
          padding: '20px',
          color: 'var(--color-text-tertiary)', fontSize: 13,
        }}>
          🐾 已经到底啦～
        </div>
      )}
    </div>
  );
}

// 暴露到全局
Object.assign(window, { FeedPage });
