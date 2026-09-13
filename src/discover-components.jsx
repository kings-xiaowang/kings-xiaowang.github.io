// 通用组件

// 顶部导航栏
function TopNav({ currentPage, onNavigate, onSearch }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { key: 'home', label: '首页' },
    { key: 'discover', label: '项目 Discover' },
    { key: 'about', label: '关于我' },
  ];

  const handleNav = (key) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className={`topnav ${scrolled ? 'scrolled' : ''}`}>
        <div className="topnav-inner">
          <div className="topnav-logo" onClick={() => handleNav('home')}>
            <div className="topnav-logo-icon">
              <PawIcon size={20} color="white" />
            </div>
            <span>PawDiscover</span>
          </div>
          <div className="topnav-links">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`topnav-link ${currentPage === item.key ? 'active' : ''}`}
                onClick={() => handleNav(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="topnav-right">
            <button className="topnav-search-btn" onClick={onSearch} title="搜索">
              <SearchIcon size={20} />
            </button>
            <button
              className="topnav-menu-btn"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* 移动端导航 */}
      {mobileOpen && (
        <div className="mobile-nav open" onClick={() => setMobileOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="topnav-search-btn mobile-nav-close"
              onClick={() => setMobileOpen(false)}
            >
              <XIcon size={22} />
            </button>
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`mobile-nav-link ${currentPage === item.key ? 'active' : ''}`}
                onClick={() => handleNav(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// 页脚
function SiteFooter({ profile }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-paw-divider">
          <span>🐾</span>
          <span>🐾</span>
          <span>🐾</span>
        </div>
        <div className="footer-logo">
          <PawIcon size={18} color="var(--color-caramel-700)" />
          PawDiscover
        </div>
        <div className="footer-made">
          Made with <span style={{ color: '#e879a9' }}>🐾</span> by {profile?.nickname || '小狐狸'}
        </div>
        <div className="footer-copy">
          © {year} PawDiscover. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// 加载状态
function LoadingState() {
  return (
    <div className="loading-wrapper">
      <div className="paw-loading">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

// 空状态
function EmptyState({ title, desc, emoji = '🦊' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-illustration">{emoji}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{desc}</div>
    </div>
  );
}

// 工具函数
function formatDate(timestamp) {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function formatNumber(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

// README 简易渲染（支持 Markdown 基础语法）
function renderReadme(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];
  let listType = null; // 'ul' or 'ol'
  let listItems = [];

  const flushList = () => {
    if (listType && listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(<ul key={`ul-${elements.length}`}>{listItems}</ul>);
      } else {
        elements.push(<ol key={`ol-${elements.length}`}>{listItems}</ol>);
      }
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    // 代码块
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${idx}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    // 标题
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={idx}>{line.slice(2)}</h1>);
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={idx}>{line.slice(3)}</h2>);
      return;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={idx}>{line.slice(4)}</h3>);
      return;
    }

    // 无序列表
    if (/^[-*]\s+/.test(line)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      const content = line.replace(/^[-*]\s+/, '');
      listItems.push(<li key={`li-${idx}`}>{renderInline(content)}</li>);
      return;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      const content = line.replace(/^\d+\.\s+/, '');
      listItems.push(<li key={`li-${idx}`}>{renderInline(content)}</li>);
      return;
    }

    // 空行
    if (line.trim() === '') {
      flushList();
      return;
    }

    // 普通段落
    flushList();
    elements.push(<p key={idx}>{renderInline(line)}</p>);
  });

  flushList();
  return elements;
}

function renderInline(text) {
  // 简单行内 code
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// 获取头像显示内容
function getAvatarDisplay(avatar, size = 'normal') {
  const presetEmojis = { fox: '🦊', cat: '🐱', wolf: '🐺', rabbit: '🐰', bear: '🐻', dragon: '🐉' };
  if (!avatar) return '🦊';
  if (avatar.startsWith('preset:')) {
    const id = avatar.replace('preset:', '');
    return presetEmojis[id] || '🦊';
  }
  if (avatar.startsWith('data:') || avatar.startsWith('/') || avatar.startsWith('http')) {
    return <img src={avatar} alt="avatar" />;
  }
  return '🦊';
}

// 社交平台图标映射
function getSocialIcon(platform) {
  const p = platform?.toLowerCase() || '';
  if (p.includes('github')) return '🐙';
  if (p.includes('twitter') || p.includes('x')) return '🐦';
  if (p.includes('博客') || p.includes('blog')) return '📝';
  if (p.includes('邮箱') || p.includes('mail') || p.includes('email')) return '📧';
  if (p.includes('b站') || p.includes('bilibili')) return '📺';
  return '🔗';
}

window.TopNav = TopNav;
window.SiteFooter = SiteFooter;
window.LoadingState = LoadingState;
window.EmptyState = EmptyState;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.renderReadme = renderReadme;
window.getAvatarDisplay = getAvatarDisplay;
window.getSocialIcon = getSocialIcon;
