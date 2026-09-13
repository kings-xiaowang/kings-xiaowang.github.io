// 搜索结果页

function SearchPage({ query, onViewDetail, onViewProfile, onBack }) {
  const [results, setResults] = React.useState({ projects: [], users: [] });
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('all'); // all | projects | users

  React.useEffect(() => {
    if (!query) {
      setResults({ projects: [], users: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    SearchAPI.search(query).then(data => {
      setResults(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [query]);

  const tabs = [
    { id: 'all', label: '全部', count: results.projects.length + results.users.length },
    { id: 'projects', label: '项目', count: results.projects.length },
    { id: 'users', label: '用户', count: results.users.length },
  ];

  const showProjects = activeTab === 'all' || activeTab === 'projects';
  const showUsers = activeTab === 'all' || activeTab === 'users';

  return (
    <div>
      {/* 面包屑 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 20, fontSize: 13, color: 'var(--color-text-tertiary)',
      }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 8 }}>
          <ChevronLeftIcon size={14} color="currentColor" />
          返回
        </button>
        <span>搜索结果</span>
        <ChevronLeftIcon size={10} color="currentColor" style={{ transform: 'rotate(180deg)' }} />
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>"{query}"</span>
      </div>

      <div style={{
        background: 'var(--color-bg-card)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: 20,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 16,
        }}>
          <SearchIcon size={20} color="var(--color-caramel-600)" />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18, fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}>
              搜索 "{query}"
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              找到 {results.projects.length} 个项目，{results.users.length} 位用户
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 4, marginBottom: 4,
          borderBottom: '2px solid var(--color-border-light)',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-caramel-500)' : '2px solid transparent',
                marginBottom: -2,
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--color-caramel-700)' : 'var(--color-text-tertiary)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: 4, fontSize: 11,
                background: activeTab === tab.id ? 'var(--color-caramel-100)' : 'var(--color-bg-soft)',
                padding: '1px 6px', borderRadius: 999,
                color: activeTab === tab.id ? 'var(--color-caramel-700)' : 'var(--color-text-tertiary)',
              }}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          <PawIcon size={28} color="var(--color-caramel-400)" />
          <div style={{ marginTop: 10, fontSize: 14 }}>搜索中...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 项目结果 */}
          {showProjects && results.projects.length > 0 && (
            <div>
              <div style={{
                fontSize: 14, fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <BookIcon size={16} color="var(--color-caramel-600)" />
                项目 ({results.projects.length})
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 14,
              }}>
                {results.projects.map(p => (
                  <RepoCard
                    key={p.id}
                    project={p}
                    onViewDetail={onViewDetail}
                    onViewProfile={onViewProfile}
                    starred={false}
                    onToggleStar={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 用户结果 */}
          {showUsers && results.users.length > 0 && (
            <div>
              <div style={{
                fontSize: 14, fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <UsersIcon size={16} color="var(--color-caramel-600)" />
                用户 ({results.users.length})
              </div>
              <UserList users={results.users} onViewProfile={onViewProfile} emptyText="" />
            </div>
          )}

          {results.projects.length === 0 && results.users.length === 0 && (
            <div style={{
              padding: '60px 0', textAlign: 'center',
              color: 'var(--color-text-tertiary)',
            }}>
              <SearchIcon size={36} color="var(--color-caramel-300)" />
              <div style={{ marginTop: 12, fontSize: 14 }}>
                没有找到与 "{query}" 相关的结果
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                试试换个关键词？
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 暴露到全局
Object.assign(window, { SearchPage });
