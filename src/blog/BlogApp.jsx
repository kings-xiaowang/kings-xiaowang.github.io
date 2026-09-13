// PawBlog 主应用 - SPA + hash 路由 + 远程数据源

class BlogErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[BlogErrorBoundary]', error, info); }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#FDF6EC', padding: '20px',
          fontFamily: "'Noto Sans SC', sans-serif",
        }
      },
        React.createElement('div', {
          style: {
            background: 'white', padding: '40px', borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(184, 116, 63, 0.12)',
            maxWidth: '500px', width: '100%', textAlign: 'center',
            border: '1px solid #F0E2CE',
          }
        },
          React.createElement('div', { style: { fontSize: '56px', marginBottom: '16px' } }, '🦊💥'),
          React.createElement('h2', {
            style: { margin: '0 0 12px 0', color: '#8B5A2B', fontFamily: "'Fredoka', sans-serif", fontSize: '22px' }
          }, '页面出了点小问题'),
          React.createElement('p', {
            style: { margin: '0 0 16px 0', color: '#6B5440', fontSize: '14px', lineHeight: '1.7' }
          }, this.state.error?.message || '渲染过程中遇到了未预期的错误。'),
          React.createElement('div', {
            style: { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }
          },
            React.createElement('button', {
              onClick: () => window.location.reload(),
              style: {
                padding: '12px 24px', background: '#B8743F', color: 'white',
                border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(184, 116, 63, 0.25)',
              }
            }, '🔄 刷新重试'),
            React.createElement('button', {
              onClick: () => { window.location.hash = '#/'; window.location.reload(); },
              style: {
                padding: '12px 24px', background: 'white', color: '#B8743F',
                border: '1px solid #E5D2BA', borderRadius: '12px', fontSize: '15px',
                fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }
            }, '🏠 返回首页'),
          )
        )
      );
    }
    return this.props.children;
  }
}

function BlogApp() {
  const [route, setRoute] = React.useState({ page: 'home', params: {} });
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);
  // 博客名称和博主昵称使用硬编码配置，不被远程数据覆盖
  const siteName = SITE_CONFIG.siteName;
  const adminNickname = SITE_CONFIG.author.nickname;

  // 远程数据相关
  const [remoteLoading, setRemoteLoading] = React.useState(false);
  const [remoteError, setRemoteError] = React.useState(null);
  const [usingRemote, setUsingRemote] = React.useState(false);

  React.useEffect(() => {
    initApp();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleHashChange = React.useCallback(() => {
    parseHashAndSetRoute();
    if (initialized) {
      try { setLoggedIn(PawDB.isLoggedIn()); } catch (e) { /* ignore */ }
    }
  }, [initialized]);

  const parseHashAndSetRoute = () => {
    try {
      const hash = window.location.hash || '#/';
      const path = hash.replace(/^#\/?/, '');
      let page = 'home';
      let params = {};
      if (!path || path === '' || path === 'home') page = 'home';
      else if (path.startsWith('post/')) { page = 'post'; params.id = path.replace('post/', ''); }
      else if (path === 'about') page = 'about';
      else if (path === 'admin') page = 'admin';
      setRoute({ page, params });
      setMobileMenuOpen(false);
    } catch (e) {
      console.warn('解析 hash 失败:', e);
      setRoute({ page: 'home', params: {} });
    }
  };

  const initApp = async () => {
    try {
      await PawDB.init();
      setLoggedIn(PawDB.isLoggedIn());
    } catch (e) {
      console.error('[BlogApp] DB 初始化失败:', e);
    } finally {
      setInitialized(true);
      parseHashAndSetRoute();
    }
  };

  // 公开页面加载远程数据
  const isPublicPage = route.page === 'home' || route.page === 'post' || route.page === 'about';

  React.useEffect(() => {
    if (!initialized || !isPublicPage) return;
    loadRemote();
  }, [initialized, route.page, isPublicPage]);

  const loadRemote = async () => {
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const result = await PawRemote.loadRemoteData({ force: false });
      if (result.success && result.data) {
        setUsingRemote(true);
        // 站点名称和博主信息由硬编码配置决定，不随远程数据变化
      } else {
        setUsingRemote(false);
        setRemoteError(result.error || '远程数据加载失败');
      }
    } catch (e) {
      setUsingRemote(false);
      setRemoteError(e.message || '远程数据加载失败');
    } finally {
      setRemoteLoading(false);
    }
  };

  const navigate = (page, params = {}) => {
    let hash = '#/';
    if (page === 'home') hash = '#/';
    else if (page === 'post') hash = '#/post/' + (params.id || '');
    else if (page === 'about') hash = '#/about';
    else if (page === 'admin') hash = '#/admin';
    if (window.location.hash === hash) {
      parseHashAndSetRoute();
    } else {
      window.location.hash = hash;
    }
  };

  const isActive = (page) => route.page === page;

  if (!initialized) {
    return React.createElement('div', { className: 'blog-app' },
      React.createElement('div', {
        style: {
          minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px',
          color: 'var(--blog-text-tertiary)', background: 'var(--blog-bg)',
        }
      },
        React.createElement('div', {
          style: { fontSize: '40px', animation: 'blogPawBounce 0.8s ease-in-out infinite' }
        }, '🐾'),
        React.createElement('div', null, '小wang正在起床...')
      )
    );
  }

  // 公开页面远程加载中的加载态
  const showRemoteLoading = isPublicPage && remoteLoading;

  return React.createElement('div', { className: 'blog-app' },
    // 远程加载失败提示条
    isPublicPage && remoteError && React.createElement('div', { className: 'blog-remote-alert' },
      React.createElement('span', null, '⚠️ 远程数据加载失败（' + remoteError + '），显示本地内容')
    ),

    React.createElement('header', { className: 'blog-header' },
      React.createElement('div', { className: 'blog-header-inner' },
        React.createElement('div', {
          className: 'blog-logo',
          onClick: () => navigate('home')
        },
          React.createElement('div', { className: 'blog-logo-icon' },
            React.createElement(BlogPawIcon, { size: 22, color: 'white' })
          ),
          React.createElement('span', { className: 'blog-logo-text' }, siteName || 'kings小wang的个人博客')
        ),

        React.createElement('nav', { className: `blog-nav ${mobileMenuOpen ? 'mobile-open' : ''}` },
          React.createElement('button', {
            className: `blog-nav-item ${isActive('home') ? 'active' : ''}`,
            onClick: () => navigate('home')
          },
            React.createElement(BlogHomeIcon, { size: 16 }), '首页'
          ),
          React.createElement('button', {
            className: `blog-nav-item ${isActive('about') ? 'active' : ''}`,
            onClick: () => navigate('about')
          },
            React.createElement(BlogUserIcon, { size: 16 }), '关于'
          ),
          (isActive('admin') || loggedIn) && React.createElement('button', {
            className: `blog-nav-item ${isActive('admin') ? 'active' : ''}`,
            onClick: () => navigate('admin')
          },
            React.createElement(BlogBookOpenIcon, { size: 16 }), '管理'
          )
        ),

        React.createElement('div', { className: 'blog-header-right' },
          React.createElement('div', {
            className: 'blog-admin-entry', title: '管理后台',
            onClick: () => navigate('admin')
          },
            React.createElement(BlogPawIcon, { size: 18 })
          ),
          React.createElement('button', {
            className: 'blog-mobile-menu-btn',
            onClick: () => setMobileMenuOpen(!mobileMenuOpen)
          },
            mobileMenuOpen
              ? React.createElement(BlogXIcon, { size: 18 })
              : React.createElement(BlogMenuIcon, { size: 18 })
          )
        )
      )
    ),

    React.createElement('main', { className: 'blog-main' },
      React.createElement(BlogErrorBoundary, null,
        showRemoteLoading
          ? React.createElement('div', { className: 'blog-remote-loading' },
              React.createElement('div', { className: 'paw' }, '🐾'),
              React.createElement('div', null, '正在加载文章...')
            )
          : (
            React.createElement(React.Fragment, null,
              route.page === 'home' && React.createElement(BlogHomePage, {
                onNavigate: navigate,
                usingRemote: usingRemote,
                key: 'home'
              }),
              route.page === 'post' && React.createElement(BlogPostPage, {
                postId: route.params.id,
                onNavigate: navigate,
                usingRemote: usingRemote,
                key: 'post-' + route.params.id
              }),
              route.page === 'about' && React.createElement(BlogAboutPage, {
                usingRemote: usingRemote,
                key: 'about'
              }),
              route.page === 'admin' && React.createElement(BlogAdminPage, {
                onNavigate: navigate,
                key: 'admin'
              })
            )
          )
      )
    ),

    React.createElement('footer', { className: 'blog-footer' },
      React.createElement('div', { className: 'blog-footer-paw' },
        React.createElement(BlogPawIcon, { size: 22 })
      ),
      React.createElement('div', null, siteName || 'kings小wang的个人博客'),
      React.createElement('div', {
        style: { marginTop: '4px', fontSize: '12px', opacity: 0.7 }
      }, 'Made with 🐾 by ' + (adminNickname || 'kings小wang'))
    )
  );
}

// 渲染
try {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    const blogRoot = ReactDOM.createRoot(rootEl);
    blogRoot.render(React.createElement(BlogApp));
  }
} catch (e) {
  console.error('React 渲染失败:', e);
}

window.BlogApp = BlogApp;
window.BlogErrorBoundary = BlogErrorBoundary;
