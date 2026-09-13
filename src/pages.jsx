// 页面组件

// ========== 项目列表页（首页） ==========
function HomePage({ projects, onViewDetail, starredProjects, onToggleStar, searchQuery, setSearchQuery, user, onOpenLogin }) {
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [langFilter, setLangFilter] = React.useState('all');

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'featured', label: '精选', icon: <SparklesIcon size={12} color="currentColor" /> },
    { id: 'opensource', label: '开源' },
  ];

  const languages = ['all', ...new Set(projects.map(p => p.language))];

  const filteredProjects = projects.filter((p) => {
    // 搜索过滤
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.desc.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 分类过滤
    if (activeFilter === 'featured' && !p.featured) return false;
    if (activeFilter === 'opensource' && p.visibility !== '开源') return false;
    // 语言过滤
    if (langFilter !== 'all' && p.language !== langFilter) return false;
    return true;
  });

  const handleNewProject = () => {
    if (!user) {
      showToast('请先登录后再创建项目 🐾', 'info');
      onOpenLogin();
      return;
    }
    showToast('新建项目功能开发中...', 'info');
  };

  return (
    <div>
      <div className="repo-header">
        <div className="repo-header-title">
          <PawIcon size={24} color="var(--color-caramel-600)" />
          我的项目窝
        </div>
        <div className="repo-header-actions">
          <button className="btn btn-secondary" onClick={handleNewProject}>
            <BookmarkIcon size={14} color="currentColor" />
            新建项目
          </button>
          <button className="btn btn-primary" onClick={handleNewProject}>
            <PlusIcon size={14} color="white" />
            导入仓库
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="filter-bar">
        {filters.map((f) => (
          <div
            key={f.id}
            className={`chip ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.icon}
            {f.label}
          </div>
        ))}

        <div style={{ width: 1, height: 24, background: 'var(--color-caramel-200)', margin: '0 4px' }}></div>

        {languages.slice(0, 5).map((lang) => (
          <div
            key={lang}
            className={`chip ${langFilter === lang ? 'active' : ''}`}
            onClick={() => setLangFilter(lang)}
          >
            {lang === 'all' ? '全部语言' : lang}
          </div>
        ))}

        <div className="filter-search">
          <span className="filter-search-icon">
            <SearchIcon size={14} color="currentColor" />
          </span>
          <input
            type="text"
            placeholder="在项目中搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 项目列表 */}
      <div className="repo-list">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🐾</div>
            <div className="empty-state-text">
              没有找到匹配的项目，试试其他关键词吧～
            </div>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <RepoCard
              key={project.id}
              project={project}
              onViewDetail={onViewDetail}
              starred={starredProjects.includes(project.id)}
              onToggleStar={onToggleStar}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ========== 项目详情页 ==========
function RepoDetailPage({ projectId, onBack, onViewDetail, user, onOpenLogin, starredProjects, onToggleStar }) {
  const project = PROJECTS_DATA.find(p => p.id === projectId);
  const [activeTab, setActiveTab] = React.useState('code');

  const starred = starredProjects.includes(projectId);

  if (!project) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">😿</div>
        <div className="empty-state-text">项目不见了...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'code', label: '代码', icon: <CodeIcon size={16} color="currentColor" />, count: project.files.length },
    { id: 'issues', label: 'Issues', icon: <IssueIcon size={16} color="currentColor" />, count: 3 },
    { id: 'pulls', label: 'Pull Requests', icon: <PullRequestIcon size={16} color="currentColor" />, count: 1 },
    { id: 'readme-tab', label: 'README', icon: <BookOpenIcon size={16} color="currentColor" /> },
  ];

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon size={14} color="currentColor" />
        返回项目列表
      </button>

      {/* 项目头部 */}
      <div className="repo-detail-header">
        <div className="repo-detail-title-row">
          <div className="repo-detail-title">
            <div className="repo-detail-icon">
              {getProjectIcon(project.icon, 24, 'white')}
            </div>
            <div className="repo-detail-name">
              {project.name}
              <span className="repo-card-visibility">{project.visibility}</span>
            </div>
          </div>
          <div className="repo-detail-actions">
            <button
              className={`btn ${starred ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onToggleStar(projectId)}
            >
              <StarIcon size={14} color="currentColor" filled={starred} />
              {starred ? '已星标' : '星标'}
              <span style={{ marginLeft: 4, opacity: 0.8 }}>
                {project.stars + (starred ? 1 : 0)}
              </span>
            </button>
            <button className="btn btn-secondary" onClick={() => {
              if (!user) { showToast('请先登录后再 Fork', 'info'); onOpenLogin(); }
              else showToast('Fork 功能开发中...', 'info');
            }}>
              <ForkIcon size={14} color="currentColor" />
              Fork
            </button>
          </div>
        </div>

        <p className="repo-detail-desc">{project.desc}</p>

        <div className="repo-detail-stats">
          <div className="repo-detail-stat">
            <EyeIcon size={14} color="currentColor" />
            关注者 {Math.floor(project.stars * 0.3)}
          </div>
          <div className="repo-detail-stat">
            <StarIcon size={14} color="currentColor" />
            {project.stars} 星标
          </div>
          <div className="repo-detail-stat">
            <ForkIcon size={14} color="currentColor" />
            {project.forks} Fork
          </div>
          <div className="repo-detail-stat">
            <span className="lang-dot" style={{ background: project.langColor }}></span>
            {project.language}
          </div>
          <div className="repo-detail-stat">
            更新于 {project.updated}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 内容 */}
      {activeTab === 'code' && (
        <div>
          <FileList files={project.files} />
          <div className="readme-card">
            <div className="readme-header">
              <BookOpenIcon size={16} color="var(--color-caramel-800)" />
              README.md
            </div>
            <div
              className="readme-body"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(project.readme)
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'readme-tab' && (
        <div className="readme-card">
          <div className="readme-header">
            <BookOpenIcon size={16} color="var(--color-caramel-800)" />
            README.md
          </div>
          <div
            className="readme-body"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(project.readme)
            }}
          />
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="file-list">
          <div className="file-list-header">
            <span>
              <IssueIcon size={14} color="var(--color-forest-600)" />
              {' '}3 个开启的 Issue
            </span>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <PlusIcon size={12} color="white" />
              新建 Issue
            </button>
          </div>
          {[
            { title: 'feat: 希望增加暗黑模式支持', labels: ['enhancement'], time: '3 天前' },
            { title: 'bug: 移动端按钮点击区域太小', labels: ['bug', 'good first issue'], time: '1 周前' },
            { title: 'docs: 翻译文档到英文', labels: ['documentation'], time: '2 周前' },
          ].map((issue, idx) => (
            <div key={idx} className="file-item">
              <div className="file-icon" style={{ color: 'var(--color-forest-500)' }}>
                <IssueIcon size={18} color="currentColor" />
              </div>
              <span className="file-name" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}>
                {issue.title}
              </span>
              <span className="file-message">
                {issue.labels.map(l => (
                  <span key={l} style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 11,
                    background: 'var(--color-caramel-100)',
                    color: 'var(--color-caramel-700)',
                    marginRight: 4,
                  }}>{l}</span>
                ))}
              </span>
              <span className="file-time">{issue.time}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pulls' && (
        <div className="file-list">
          <div className="file-list-header">
            <span>
              <PullRequestIcon size={14} color="var(--color-forest-600)" />
              {' '}1 个开启的 Pull Request
            </span>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <PlusIcon size={12} color="white" />
              新建 PR
            </button>
          </div>
          <div className="file-item">
            <div className="file-icon" style={{ color: 'var(--color-forest-500)' }}>
              <PullRequestIcon size={18} color="currentColor" />
            </div>
            <span className="file-name" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}>
              feat: 添加毛茸茸的加载动画效果
            </span>
            <span className="file-message">#42 · 由 @fluffydev 提交</span>
            <span className="file-time">2 天前</span>
          </div>
        </div>
      )}
    </div>
  );
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
  // 移除空段落
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

// ========== 个人主页 ==========
function ProfilePage({ onViewDetail, user, starredProjects, onToggleStar, onOpenLogin }) {
  const [activeTab, setActiveTab] = React.useState('repos');
  const featuredProjects = PROJECTS_DATA.filter(p => p.featured);

  // 显示的用户：登录用户显示自己，否则显示默认的 foxiepaws
  const displayUser = user ? {
    name: user.username,
    handle: user.username,
    avatar: user.avatar || USER_PROFILE.avatar,
    bio: user.bio || '这只小兽还没有填写简介，快来认识一下吧～',
    location: user.location || '神秘森林',
    blog: user.blog || '',
    joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }) + ' 加入' : '刚刚加入',
    repos: PROJECTS_DATA.length,
    totalStars: PROJECTS_DATA.reduce((s, p) => s + p.stars, 0),
    followers: Math.floor(PROJECTS_DATA.reduce((s, p) => s + p.stars, 0) * 0.3),
    following: 12,
    isOwn: true,
  } : {
    name: USER_PROFILE.name,
    handle: USER_PROFILE.handle,
    avatar: USER_PROFILE.avatar,
    bio: USER_PROFILE.bio,
    location: USER_PROFILE.location,
    blog: USER_PROFILE.blog,
    joined: USER_PROFILE.joined,
    repos: PROJECTS_DATA.length,
    totalStars: PROJECTS_DATA.reduce((s, p) => s + p.stars, 0),
    followers: USER_PROFILE.followers,
    following: USER_PROFILE.following,
    isOwn: false,
  };

  const tabs = [
    { id: 'repos', label: '项目', icon: <BookIcon size={16} color="currentColor" />, count: PROJECTS_DATA.length },
    { id: 'starred', label: '星标', icon: <StarIcon size={16} color="currentColor" />, count: starredProjects.length },
    { id: 'activity', label: '动态', icon: <ActivityIcon size={16} color="currentColor" /> },
  ];

  return (
    <div>
      {/* Hero 区域 */}
      <div className="profile-hero">
        <div className="paw-decoration top-right">
          <PawIcon size={120} color="var(--color-caramel-500)" />
        </div>
        <div className="profile-hero-content">
          <img
            className="profile-hero-avatar"
            src={displayUser.avatar}
            alt={displayUser.name}
          />
          <div className="profile-hero-info">
            <h1 className="profile-hero-name">{displayUser.name}</h1>
            <div className="profile-hero-handle">@{displayUser.handle}</div>
            <p className="profile-hero-bio">{displayUser.bio}</p>
            <div className="profile-hero-details">
              <div className="profile-hero-detail">
                <MapPinIcon size={14} color="currentColor" />
                {displayUser.location}
              </div>
              {displayUser.blog && (
                <div className="profile-hero-detail">
                  <LinkIcon size={14} color="currentColor" />
                  <a href="#" onClick={(e) => e.preventDefault()}>{displayUser.blog}</a>
                </div>
              )}
              <div className="profile-hero-detail">
                <CalendarIcon size={14} color="currentColor" />
                {displayUser.joined}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-hero-stats">
          <div className="profile-hero-stat">
            <div className="profile-hero-stat-num">{displayUser.repos}</div>
            <div className="profile-hero-stat-label">公开项目</div>
          </div>
          <div className="profile-hero-stat">
            <div className="profile-hero-stat-num">{displayUser.totalStars}</div>
            <div className="profile-hero-stat-label">总星标数</div>
          </div>
          <div className="profile-hero-stat">
            <div className="profile-hero-stat-num">{displayUser.followers}</div>
            <div className="profile-hero-stat-label">关注者</div>
          </div>
          <div className="profile-hero-stat">
            <div className="profile-hero-stat-num">{displayUser.following}</div>
            <div className="profile-hero-stat-label">关注中</div>
          </div>
        </div>
      </div>

      {/* 贡献热力图 */}
      <ContributionGraph />

      {/* 精选项目 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <SparklesIcon size={18} color="var(--color-mint-gold)" />
          精选项目
        </div>
        <div className="featured-repos">
          {featuredProjects.map((project) => (
            <FeaturedRepoCard
              key={project.id}
              project={project}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      </div>

      {/* Tabs + 项目列表 */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'repos' && (
        <div className="repo-list">
          {PROJECTS_DATA.map((project) => (
            <RepoCard
              key={project.id}
              project={project}
              onViewDetail={onViewDetail}
              starred={starredProjects.includes(project.id)}
              onToggleStar={onToggleStar}
            />
          ))}
        </div>
      )}

      {activeTab === 'starred' && (
        <div>
          {starredProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <div className="empty-state-text">
                {user ? '还没有收藏任何项目，快去发现喜欢的项目吧～' : '登录后可以查看你的星标收藏'}
              </div>
              {!user && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={onOpenLogin}
                >
                  登录查看星标
                </button>
              )}
            </div>
          ) : (
            <div className="repo-list">
              {PROJECTS_DATA.filter(p => starredProjects.includes(p.id)).map((project) => (
                <RepoCard
                  key={project.id}
                  project={project}
                  onViewDetail={onViewDetail}
                  starred={true}
                  onToggleStar={onToggleStar}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="file-list">
          <div className="file-list-header">
            最近动态
          </div>
          {[
            { action: '推送了', repo: 'furry-ui-kit', detail: 'feat: 添加毛茸茸按钮组件', time: '2 天前' },
            { action: '创建了仓库', repo: 'cozy-vscode-theme', detail: '毛茸茸 VS Code 主题上线啦', time: '1 个月前' },
            { action: 'Star 了', repo: 'some-other-project', detail: '一个很棒的开源项目', time: '1 个月前' },
            { action: '合并了 PR', repo: 'pawprint-blog', detail: 'feat: 支持暗黑模式', time: '2 个月前' },
          ].map((item, idx) => (
            <div key={idx} className="file-item">
              <div className="file-icon" style={{ color: 'var(--color-caramel-500)' }}>
                <ActivityIcon size={18} color="currentColor" />
              </div>
              <span className="file-name" style={{ fontFamily: 'var(--font-body)' }}>
                <strong style={{ color: 'var(--color-caramel-700)' }}>{item.action}</strong>
                {' '}{item.repo}
              </span>
              <span className="file-message">{item.detail}</span>
              <span className="file-time">{item.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 暴露到全局
Object.assign(window, {
  HomePage,
  RepoDetailPage,
  ProfilePage,
  renderMarkdown,
});
