// PawDiscover 主应用入口
function PawDiscoverApp() {
  const [currentPage, setCurrentPage] = React.useState('home');
  const [pageParams, setPageParams] = React.useState({});
  const [profile, setProfile] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [stats, setStats] = React.useState({ projectCount: 0, categoryCount: 0, totalStars: 0 });
  const [loading, setLoading] = React.useState(true);
  const [pageTransition, setPageTransition] = React.useState(false);

  React.useEffect(() => {
    // 初始加载数据
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    // 模拟加载
    setTimeout(() => {
      const p = PawData.getProfile();
      const projs = PawData.getProjects();
      const s = PawData.getStats();
      setProfile(p);
      setProjects(projs);
      setStats(s);
      setLoading(false);
    }, 300);
  };

  const handleNavigate = (page, params = {}) => {
    setPageTransition(true);
    setTimeout(() => {
      setCurrentPage(page);
      setPageParams(params);
      setPageTransition(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 150);
  };

  const handleSearch = () => {
    handleNavigate('discover');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh',
      }}>
        <LoadingState />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'discover':
        return (
          <DiscoverPage
            projects={projects}
            onNavigate={handleNavigate}
          />
        );
      case 'detail':
        return (
          <ProjectDetailPage
            projectId={pageParams.id}
            onNavigate={handleNavigate}
          />
        );
      case 'about':
        return <AboutPage profile={profile} />;
      case 'home':
      default:
        return (
          <HomePage
            profile={profile}
            stats={stats}
            projects={projects}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  // 详情页不显示导航栏（有面包屑），但其实所有页面都显示导航栏
  const showNav = true;

  return (
    <div className="page-container">
      {showNav && (
        <TopNav
          currentPage={currentPage === 'detail' ? 'discover' : currentPage}
          onNavigate={handleNavigate}
          onSearch={handleSearch}
        />
      )}

      <main className={`page-content ${pageTransition ? 'page-fade-enter' : ''}`}>
        {renderPage()}
      </main>

      <SiteFooter profile={profile} />
    </div>
  );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PawDiscoverApp />);
