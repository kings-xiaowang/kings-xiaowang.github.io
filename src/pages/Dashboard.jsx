// 仪表盘页面
function DashboardPage({ admin, onNavigate }) {
  const [stats, setStats] = React.useState({ projectCount: 0, categoryCount: 0, totalViews: 0, lastUpdated: 0 });
  const [recentProjects, setRecentProjects] = React.useState([]);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsData, recentData] = await Promise.all([
      AdminProjectsAPI.stats(),
      AdminProjectsAPI.recent(5),
    ]);
    setStats(statsData);
    setRecentProjects(recentData.projects);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatViews = (num) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
        <p className="page-subtitle">欢迎回来，{(admin && admin.nickname) || '管理员'}！今天也要加油哦 🐾</p>
      </div>

      {/* 欢迎区 */}
      <div className="welcome-section">
        <div className="welcome-text">
          <h2>你好，{admin?.nickname || '小狐狸'}！🦊</h2>
          <p>这里是你的私有管理后台，可以管理所有项目和个人信息。</p>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('projects', { action: 'new' })}>
            <PlusIcon size={16} />
            添加项目
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('profile')}>
            <UserIcon size={16} />
            编辑资料
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FolderIcon size={22} />
          </div>
          <div className="stat-value">{stats.projectCount}</div>
          <div className="stat-label">项目总数</div>
        </div>
        <div className="stat-card mauve">
          <div className="stat-icon">
            <LayersIcon size={22} />
          </div>
          <div className="stat-value">{stats.categoryCount}</div>
          <div className="stat-label">分类数</div>
        </div>
        <div className="stat-card forest">
          <div className="stat-icon">
            <EyeIcon size={22} />
          </div>
          <div className="stat-value">{formatViews(stats.totalViews)}</div>
          <div className="stat-label">总浏览量</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">
            <CalendarIcon size={22} />
          </div>
          <div className="stat-value" style={{ fontSize: 20 }}>{formatDate(stats.lastUpdated)}</div>
          <div className="stat-label">最近更新</div>
        </div>
      </div>

      {/* 最近项目 */}
      <div className="card recent-projects-section">
        <div className="recent-projects-header">
          <div className="recent-projects-title">
            <FolderIcon size={18} color="var(--color-caramel-700)" style={{ marginRight: 8 }} />
            最近更新的项目
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('projects')}>
            查看全部
            <ChevronRightIcon size={14} />
          </button>
        </div>
        <div className="recent-projects-list">
          {recentProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div className="empty-state-text">还没有项目，点击上方按钮创建第一个吧～</div>
            </div>
          ) : (
            recentProjects.map((p) => (
              <div
                key={p.id}
                className="recent-project-item"
                onClick={() => onNavigate('projects', { action: 'edit', id: p.id })}
              >
                <div className="recent-project-icon">
                  <FolderIcon size={18} color="white" />
                </div>
                <div className="recent-project-info">
                  <div className="recent-project-name">{p.name}</div>
                  <div className="recent-project-meta">
                    <span>{p.category || '未分类'}</span>
                    <span>·</span>
                    <span>{p.language}</span>
                    <span>·</span>
                    <span>更新于 {formatDate(p.updatedAt)}</span>
                  </div>
                </div>
                <div className="recent-project-actions">
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('projects', { action: 'edit', id: p.id });
                    }}
                    title="编辑"
                  >
                    <EditIcon size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

window.DashboardPage = DashboardPage;
