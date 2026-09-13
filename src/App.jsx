// 管理后台主入口
function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [admin, setAdmin] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [pageParams, setPageParams] = React.useState({});

  // 页面加载时检查登录状态
  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await AdminAuthAPI.me();
      if (data.admin) {
        setAdmin(data.admin);
      }
    } catch (e) {
      // 未登录，正常
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSuccess = (adminData) => {
    setAdmin(adminData);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      await AdminAuthAPI.logout();
      setAdmin(null);
      setCurrentPage('dashboard');
      showToast('已退出登录，再见啦～👋', 'info');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAdminUpdate = (updatedAdmin) => {
    setAdmin(updatedAdmin);
  };

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 加载中
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'var(--font-display)',
        color: 'var(--color-text-tertiary)', fontSize: 18,
      }}>
        <PawIcon size={32} color="var(--color-caramel-400)" />
        <span style={{ marginLeft: 12 }}>加载中...</span>
      </div>
    );
  }

  // 未登录 - 显示登录页
  if (!admin) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 已登录 - 管理后台布局
  const navItems = [
    { key: 'dashboard', label: '仪表盘', icon: DashboardIcon },
    { key: 'projects', label: '项目管理', icon: FolderIcon },
    { key: 'profile', label: '个人信息', icon: UserIcon },
    { key: 'data', label: '数据管理', icon: DatabaseIcon },
  ];

  const getAvatarContent = () => {
    if (!admin) return '🦊';
    if (admin.avatar && admin.avatar.startsWith('preset:')) {
      const presetId = admin.avatar.replace('preset:', '');
      const presetEmojis = { fox: '🦊', cat: '🐱', wolf: '🐺', rabbit: '🐰', bear: '🐻', dragon: '🐉' };
      return presetEmojis[presetId] || '🦊';
    }
    if (admin.avatar && admin.avatar.startsWith('data:')) {
      return <img src={admin.avatar} alt="avatar" />;
    }
    return '🦊';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectsPage key={Date.now()} onNavigate={handleNavigate} initialAction={pageParams.action} initialId={pageParams.id} />;
      case 'profile':
        return <ProfilePage admin={admin} onAdminUpdate={handleAdminUpdate} />;
      case 'data':
        return <DataPage onLogout={handleLogout} />;
      case 'dashboard':
      default:
        return <DashboardPage admin={admin} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="admin-layout">
      {/* 移动端菜单按钮 */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <MenuIcon size={20} color="var(--color-caramel-700)" />
      </button>

      {/* 移动端遮罩 */}
      {mobileMenuOpen && (
        <div
          className={`mobile-overlay ${mobileMenuOpen ? 'show' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 左侧导航栏 */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <PawIcon size={22} color="white" />
          </div>
          <div>
            <div className="admin-sidebar-title">PawAdmin</div>
            <div className="admin-sidebar-subtitle">私有管理后台</div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="nav-section-title">主菜单</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
                onClick={() => handleNavigate(item.key)}
              >
                <span className="nav-item-icon">
                  <Icon size={18} />
                </span>
                {item.label}
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          <div className="nav-section-title">账号</div>
          <button
            className="nav-item nav-item-logout"
            onClick={handleLogout}
          >
            <span className="nav-item-icon">
              <LogoutIcon size={18} />
            </span>
            退出登录
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-mini-profile" onClick={() => handleNavigate('profile')}>
            <div className="admin-mini-avatar">
              {getAvatarContent()}
            </div>
            <div className="admin-mini-info">
              <div className="admin-mini-name">{admin?.nickname || '管理员'}</div>
              <div className="admin-mini-role">超级管理员</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="admin-main">
        <div className="admin-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
