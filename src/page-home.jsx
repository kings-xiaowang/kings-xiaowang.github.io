// 首页 - 项目探索列表

function HomePage({ onViewDetail, onViewProfile, starredProjects, onToggleStar, user, onOpenLogin }) {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState('updated');
  const [activeTopic, setActiveTopic] = React.useState('');

  const loadProjects = () => {
    setLoading(true);
    const params = { sort: sortBy };
    if (activeTopic) params.topic = activeTopic;
    ProjectsAPI.list(params).then(data => {
      setProjects(data.projects || []);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  };

  React.useEffect(() => {
    loadProjects();
  }, [sortBy, activeTopic]);

  // 监听话题过滤事件
  React.useEffect(() => {
    const handler = (e) => {
      setActiveTopic(e.detail);
    };
    window.addEventListener('filter-topic', handler);
    return () => window.removeEventListener('filter-topic', handler);
  }, []);

  const featuredProjects = projects.filter(p => p.featured).slice(0, 3);

  const sortOptions = [
    { id: 'updated', label: '最近更新' },
    { id: 'stars', label: '最多星标' },
    { id: 'created', label: '最新创建' },
  ];

  const topicList = ['furry', 'react', 'vue', 'typescript', 'rust', 'cli', 'ui'];

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-caramel-100) 0%, var(--color-cream-100) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        marginBottom: 24,
        border: '2px solid var(--color-caramel-200)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -10,
          fontSize: 80, opacity: 0.15,
        }}>🐾</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26, fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 6,
        }}>欢迎来到爪印代码库 🐾</h1>
        <p style={{
          fontSize: 14, color: 'var(--color-text-secondary)',
          marginBottom: 16, maxWidth: 500, lineHeight: 1.6,
        }}>
          一个毛茸茸风格的开源社区平台，发现和分享有趣的项目，认识志同道合的小伙伴，一起用毛茸茸的方式写代码！
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => {
            if (user) {
              const evt = new CustomEvent('navigate-newproject', {});
              window.dispatchEvent(evt);
            } else {
              onOpenLogin();
            }
          }}>
            <PlusIcon size={14} color="white" />
            发布你的项目
          </button>
          <button className="btn btn-secondary" onClick={() => {
            const evt = new CustomEvent('navigate-feed', {});
            window.dispatchEvent(evt);
          }}>
            <ActivityIcon size={14} color="currentColor" />
            看看最新动态
          </button>
        </div>
      </div>

      {/* 精选项目 */}
      {featuredProjects.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-header">
            <h2 className="section-title">
              <SparklesIcon size={18} color="var(--color-mint-gold)" />
              精选项目
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {featuredProjects.map(p => (
              <FeaturedRepoCard key={p.id} project={p} onViewDetail={onViewDetail} />
            ))}
          </div>
        </div>
      )}

      {/* 话题标签 */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          className={`topic-chip ${!activeTopic ? 'active' : ''}`}
          onClick={() => setActiveTopic('')}
          style={{
            padding: '5px 14px',
            borderRadius: 999,
            border: '2px solid',
            borderColor: !activeTopic ? 'var(--color-caramel-400)' : 'var(--color-border)',
            background: !activeTopic ? 'var(--color-caramel-500)' : 'var(--color-bg-card)',
            color: !activeTopic ? 'white' : 'var(--color-text-secondary)',
            fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          全部
        </button>
        {topicList.map(topic => (
          <button
            key={topic}
            className={`topic-chip ${activeTopic === topic ? 'active' : ''}`}
            onClick={() => setActiveTopic(topic)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              border: '2px solid',
              borderColor: activeTopic === topic ? 'var(--color-caramel-400)' : 'var(--color-border)',
              background: activeTopic === topic ? 'var(--color-caramel-500)' : 'var(--color-bg-card)',
              color: activeTopic === topic ? 'white' : 'var(--color-text-secondary)',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            #{topic}
          </button>
        ))}
      </div>

      {/* 排序 + 项目数 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          共找到 <strong style={{ color: 'var(--color-text-primary)' }}>{projects.length}</strong> 个项目
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {sortOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: sortBy === opt.id ? 'var(--color-caramel-100)' : 'transparent',
                color: sortBy === opt.id ? 'var(--color-caramel-700)' : 'var(--color-text-tertiary)',
                fontSize: 12, fontWeight: sortBy === opt.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          <PawIcon size={28} color="var(--color-caramel-400)" />
          <div style={{ marginTop: 10, fontSize: 14 }}>加载中...</div>
        </div>
      ) : projects.length === 0 ? (
        <div style={{
          padding: '60px 0', textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          background: 'var(--color-bg-soft)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--color-border)',
        }}>
          <FolderIcon size={36} color="var(--color-caramel-300)" />
          <div style={{ marginTop: 12, fontSize: 14 }}>暂无匹配的项目</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <RepoCard
              key={p.id}
              project={p}
              onViewDetail={onViewDetail}
              onViewProfile={onViewProfile}
              starred={starredProjects.includes(p.id)}
              onToggleStar={onToggleStar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 暴露到全局
Object.assign(window, { HomePage });
