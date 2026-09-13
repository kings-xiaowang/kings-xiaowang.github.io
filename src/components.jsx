// 可复用组件

// ========== 顶部导航栏 ==========
function Navbar({
  currentPage,
  onNavigate,
  onNewProject,
  onMyProfile,
  searchQuery,
  onSearchSubmit,
  user,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  onOpenSettings,
}) {
  const [localQuery, setLocalQuery] = React.useState(searchQuery || '');
  const [focused, setFocused] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState({ projects: [], users: [] });

  React.useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  React.useEffect(() => {
    if (!focused || !localQuery.trim() || localQuery.trim().length < 2) {
      setSuggestions({ projects: [], users: [] });
      return;
    }
    let cancelled = false;
    SearchAPI.search(localQuery.trim()).then(data => {
      if (!cancelled) setSuggestions(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [localQuery, focused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchSubmit(localQuery);
    setFocused(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => onNavigate('home')}>
          <div className="navbar-logo-icon">
            <PawIcon size={20} color="white" />
          </div>
          <span>爪印代码库</span>
        </div>

        <div className="navbar-search" style={{ position: 'relative' }}>
          <span className="navbar-search-icon">
            <SearchIcon size={16} color="currentColor" />
          </span>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="搜索项目、用户或话题..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
            />
          </form>
          {focused && (suggestions.projects.length > 0 || suggestions.users.length > 0) && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              marginTop: 6,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              maxHeight: 400,
              overflow: 'auto',
            }}>
              {suggestions.projects.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                    color: 'var(--color-text-tertiary)', padding: '4px 14px 8px',
                    letterSpacing: 0.5,
                  }}>项目</div>
                  {suggestions.projects.slice(0, 5).map(p => (
                    <div
                      key={p.id}
                      className="search-suggestion-item"
                      onMouseDown={(e) => { e.preventDefault(); onSearchSubmit(localQuery); onNavigate ? null : null; }}
                      onClick={() => { onNavigate && onNavigate('home'); onSearchSubmit && onSearchSubmit(''); window.__gotoRepo && window.__gotoRepo(p.id); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px', cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      <div className="repo-card-icon" style={{ width: 24, height: 24, fontSize: 12 }}>
                        {getProjectIcon(p.icon, 12, 'white')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{p.desc?.slice(0, 40)}...</div>
                      </div>
                      <span className="lang-dot" style={{ background: p.langColor }}></span>
                    </div>
                  ))}
                </div>
              )}
              {suggestions.users.length > 0 && (
                <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-border-light)' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                    color: 'var(--color-text-tertiary)', padding: '4px 14px 8px',
                    letterSpacing: 0.5,
                  }}>用户</div>
                  {suggestions.users.slice(0, 5).map(u => (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px', cursor: 'pointer',
                        fontSize: 13,
                      }}
                      onMouseDown={(e) => { e.preventDefault(); setFocused(false); }}
                      onClick={() => {
                        setFocused(false);
                        onMyProfile && onMyProfile();
                        // use the callback from App to go to user profile
                        const evt = new CustomEvent('navigate-profile', { detail: u.username });
                        window.dispatchEvent(evt);
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--color-caramel-200)',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 600, color: 'var(--color-caramel-600)',
                            fontFamily: 'var(--font-display)',
                          }}>{u.username?.[0]?.toUpperCase()}</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{u.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                          {u.bio ? u.bio.slice(0, 30) + '...' : '这只小兽还没有填写简介'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="navbar-nav">
          <div
            className={`navbar-nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            探索
          </div>
          <div
            className={`navbar-nav-item ${currentPage === 'feed' ? 'active' : ''}`}
            onClick={() => onNavigate('feed')}
          >
            最新动态
          </div>
          {user && (
            <div
              className={`navbar-nav-item ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={onMyProfile}
            >
              我的主页
            </div>
          )}
        </div>

        {user ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={onNewProject}>
              <PlusIcon size={14} color="white" />
              发布项目
            </button>
            <UserDropdown
              user={user}
              onLogout={onLogout}
              onNavigate={onNavigate}
              onOpenSettings={onOpenSettings}
              onMyProfile={onMyProfile}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 16px', fontSize: 13 }}
              onClick={onOpenLogin}
            >
              登录
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: 13 }}
              onClick={onOpenRegister}
            >
              注册
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

// ========== 左侧边栏 ==========
function Sidebar({ currentPage, onNavigate, activeMenu, user, onViewProfile, onOpenLogin }) {
  const [stats, setStats] = React.useState({ projectCount: 0, starCount: 0, followerCount: 0 });

  React.useEffect(() => {
    if (user) {
      UsersAPI.getProfile(user.username).then(data => {
        setStats(data.stats);
      }).catch(() => {});
    }
  }, [user?.username]);

  const displayUser = user ? {
    name: user.username,
    handle: user.username,
    avatar: user.avatar || '',
    bio: user.bio || '这只小兽还没有填写简介～',
    repos: stats.projectCount,
    stars: stats.starCount,
    followers: stats.followerCount,
    isLoggedIn: true,
  } : {
    name: '访客小兽',
    handle: 'guest',
    avatar: '',
    bio: '登录后即可发布项目、收藏星标、关注其他开发者',
    repos: 0,
    stars: 0,
    followers: 0,
    isLoggedIn: false,
  };

  return (
    <aside className="sidebar">
      {/* 个人资料卡 */}
      <div className="sidebar-card profile-card">
        <div
          className="profile-avatar-wrapper"
          style={{ cursor: displayUser.isLoggedIn ? 'pointer' : 'default' }}
          onClick={() => displayUser.isLoggedIn && onViewProfile && onViewProfile(user.username)}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            overflow: 'hidden', border: '3px solid var(--color-cream-100)',
            background: 'var(--color-caramel-200)',
          }}>
            {displayUser.avatar ? (
              <img
                className="profile-avatar"
                src={displayUser.avatar}
                alt={displayUser.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-caramel-600)',
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600,
              }}>
                {displayUser.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="profile-avatar-badge">
            <PawIcon size={12} color="white" />
          </div>
        </div>
        <div className="profile-name">{displayUser.name}</div>
        <div className="profile-handle">@{displayUser.handle}</div>
        <div className="profile-bio">{displayUser.bio}</div>

        {!displayUser.isLoggedIn && (
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 12, padding: '8px 14px', fontSize: 13 }}
            onClick={onOpenLogin}
          >
            <PawIcon size={14} color="white" />
            登录同步数据
          </button>
        )}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-num">{displayUser.repos}</span>
            <span className="profile-stat-label">项目</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-num">{displayUser.stars}</span>
            <span className="profile-stat-label">星标</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-num">{displayUser.followers}</span>
            <span className="profile-stat-label">关注者</span>
          </div>
        </div>
      </div>

      {/* 菜单 */}
      <div className="sidebar-card">
        <div className="sidebar-menu">
          <div className="sidebar-menu-title">探索</div>
          <div
            className={`sidebar-menu-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            <span className="sidebar-menu-item-icon">
              <BookIcon size={18} color="currentColor" />
            </span>
            探索项目
          </div>
          <div
            className={`sidebar-menu-item ${currentPage === 'feed' ? 'active' : ''}`}
            onClick={() => onNavigate('feed')}
          >
            <span className="sidebar-menu-item-icon">
              <ActivityIcon size={18} color="currentColor" />
            </span>
            最新动态
          </div>
        </div>
      </div>

      <div className="sidebar-card">
        <div className="sidebar-menu">
          <div className="sidebar-menu-title">话题</div>
          {['furry', 'react', 'typescript', 'rust', 'vue'].map(topic => (
            <div
              key={topic}
              className="sidebar-menu-item"
              onClick={() => {
                if (onNavigate) onNavigate('home');
                setTimeout(() => {
                  const evt = new CustomEvent('filter-topic', { detail: topic });
                  window.dispatchEvent(evt);
                }, 50);
              }}
            >
              <span className="sidebar-menu-item-icon">
                <TagIcon size={16} color="currentColor" />
              </span>
              {topic}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ========== 项目卡片 ==========
function RepoCard({ project, onViewDetail, onViewProfile, starred, onToggleStar }) {
  const ownerAvatar = project.owner?.avatar || '';
  const ownerName = project.owner?.username || '';

  return (
    <div className="repo-card" onClick={() => onViewDetail(project.id)}>
      <div className="repo-card-header">
        <div className="repo-card-title">
          <div className="repo-card-icon">
            {getProjectIcon(project.icon, 18, 'white')}
          </div>
          <div className="repo-card-name">
            {project.name}
            <span className="repo-card-visibility">{project.visibility}</span>
          </div>
        </div>
        <button
          className={`repo-card-star-btn ${starred ? 'starred' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(project.id);
          }}
        >
          <StarIcon size={14} color="currentColor" filled={starred} />
          {project.stars + (starred ? 1 : 0)}
        </button>
      </div>

      <p className="repo-card-desc">{project.desc}</p>

      {project.topics && project.topics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {project.topics.slice(0, 4).map(topic => (
            <span key={topic} className="topic-tag">#{topic}</span>
          ))}
        </div>
      )}

      <div className="repo-card-footer">
        <div
          className="repo-card-meta"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile && onViewProfile(ownerName);
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%', overflow: 'hidden',
            background: 'var(--color-caramel-200)', display: 'inline-block',
            marginRight: 4,
          }}>
            {ownerAvatar ? (
              <img src={ownerAvatar} alt={ownerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 600, color: 'var(--color-caramel-600)',
              }}>{ownerName?.[0]?.toUpperCase()}</div>
            )}
          </div>
          {ownerName}
        </div>
        <div className="repo-card-meta">
          <span className="lang-dot" style={{ background: project.langColor }}></span>
          {project.language}
        </div>
        <div className="repo-card-meta">
          <StarIcon size={14} color="currentColor" />
          {project.stars}
        </div>
      </div>
    </div>
  );
}

// ========== 精选项目卡片 ==========
function FeaturedRepoCard({ project, onViewDetail }) {
  return (
    <div className="featured-repo-card" onClick={() => onViewDetail(project.id)}>
      <div className="featured-repo-header">
        <div className="featured-repo-icon">
          {getProjectIcon(project.icon, 16, 'white')}
        </div>
        <div className="featured-repo-name">{project.name}</div>
      </div>
      <p className="featured-repo-desc">{project.desc}</p>
      <div className="featured-repo-footer">
        <span className="lang-dot" style={{ background: project.langColor }}></span>
        {project.language}
        <StarIcon size={12} color="currentColor" /> {project.stars}
      </div>
    </div>
  );
}

// ========== Tab 组件 ==========
function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className="tab-count">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ========== 贡献热力图 ==========
function ContributionGraph() {
  return (
    <div className="contribution-card">
      <div className="contribution-title">
        <ActivityIcon size={18} color="var(--color-caramel-600)" />
        爪印贡献图
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>
          过去一年共 578 次贡献
        </span>
      </div>
      <div className="contribution-grid">
        {CONTRIBUTION_DATA.map((week, wi) => (
          <div key={wi} className="contrib-week">
            {week.map((day, di) => (
              <div key={di} className={`contrib-day l${day}`} title={`第 ${wi + 1} 周 周${['日','一','二','三','四','五','六'][di]}: ${day} 次贡献`}></div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
        少
        <div className="contrib-day"></div>
        <div className="contrib-day l1"></div>
        <div className="contrib-day l2"></div>
        <div className="contrib-day l3"></div>
        <div className="contrib-day l4"></div>
        多
      </div>
    </div>
  );
}

// ========== 文件列表（带下载功能） ==========
function FileList({ files }) {
  if (!files || files.length === 0) {
    return (
      <div style={{
        padding: 40, textAlign: 'center',
        color: 'var(--color-text-tertiary)', fontSize: 13,
        background: 'var(--color-bg-soft)',
        borderRadius: 'var(--radius-lg)',
        border: '2px dashed var(--color-border)',
      }}>
        <FolderIcon size={32} color="var(--color-caramel-300)" />
        <div style={{ marginTop: 8 }}>暂无文件</div>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <div className="file-list-branch">
          <GitBranchIcon size={14} color="currentColor" />
          main
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          {files.length} 个文件
        </div>
      </div>
      {files.map((file, idx) => (
        <div key={idx} className="file-item">
          <div className={`file-icon ${file.type === 'folder' ? 'folder' : ''}`}>
            {file.type === 'folder' ? (
              <FolderIcon size={20} color="currentColor" />
            ) : (
              <FileIcon size={20} color="currentColor" />
            )}
          </div>
          <span className="file-name">{file.name}</span>
          <span className="file-message">
            {file.size !== undefined ? `${(file.size / 1024).toFixed(1)} KB` : file.message || ''}
          </span>
          {file.url ? (
            <a
              href={file.url}
              download={file.name}
              className="file-time"
              style={{ color: 'var(--color-caramel-600)', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              下载 ↓
            </a>
          ) : (
            <span className="file-time">{file.time || file.uploadedAt ? formatDate(file.uploadedAt) : ''}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ========== 工具函数 ==========
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

// 简单的 Markdown 渲染器
function renderMarkdown(md) {
  if (!md) return '';
  let html = md.trim();

  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 标题
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 列表项
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    return `<ul>\n${match}</ul>\n`;
  });

  // 段落
  html = html.replace(/^(?!<[hlu]|<pre|<p)(.+)$/gm, '<p>$1</p>');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

// 暴露到全局
Object.assign(window, {
  Navbar,
  Sidebar,
  RepoCard,
  FeaturedRepoCard,
  Tabs,
  ContributionGraph,
  FileList,
  formatDate,
  formatFullDate,
  renderMarkdown,
});
