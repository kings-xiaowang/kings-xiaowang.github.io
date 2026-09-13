// PawBlog 关于页（支持远程数据）

function BlogAboutPage({ usingRemote }) {
  const [admin, setAdmin] = React.useState(null);
  const [blogInfo, setBlogInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
  }, [usingRemote]);

  const loadData = async () => {
    try {
      if (usingRemote) {
        const info = PawRemote.getRemoteBlogInfo();
        setBlogInfo(info);
        setAdmin({
          nickname: info?.author || '小狐狸',
          avatar: info?.avatar || 'preset:fox',
          bio: info?.bio || '',
          location: info?.location || '',
          email: info?.email || '',
          github: (info?.socialLinks || []).find(s => s.name === 'GitHub')?.url || '',
          blog: '',
          skills: [],
          siteCreatedAt: null,
        });
      } else {
        await PawDB.ensureReady();
        setAdmin(await PawDB.getAdminPublic());
      }
    } catch (e) {
      console.warn('[BlogAbout] 加载失败:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="blog-page">
        <div className="blog-remote-loading">
          <div className="paw">🐾</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  const siteCreatedAt = admin?.siteCreatedAt || (Date.now() - 86400000 * 365);

  const siteAge = () => {
    const days = Math.floor((Date.now() - siteCreatedAt) / 86400000);
    const years = Math.floor(days / 365);
    const remain = days % 365;
    if (years > 0) return `已运行 ${years} 年 ${remain} 天`;
    return `已运行 ${days} 天`;
  };

  const skills = admin?.skills?.length
    ? admin.skills
    : ['前端开发', 'React', 'Vue', 'CSS', 'UI设计', 'furry文化', '写作'];

  // 构建社交链接列表
  const socialLinks = [];
  if (admin?.github) {
    socialLinks.push({ name: 'GitHub', url: admin.github, icon: 'github' });
  }
  if (admin?.email) {
    socialLinks.push({ name: '邮箱', url: 'mailto:' + admin.email, icon: 'mail' });
  }
  if (admin?.blog) {
    socialLinks.push({ name: '博客', url: 'https://' + admin.blog, icon: 'book' });
  }

  return (
    <div className="blog-page blog-about-page">
      <div className="blog-about-header">
        <div className="blog-about-avatar">
          {blogGetAvatarEmoji(admin?.avatar)}
        </div>
        <h1 className="blog-about-name">{admin?.nickname || 'kings小wang'}</h1>
        <p className="blog-about-bio">
          {admin?.bio || '一只热爱代码和毛茸茸文化的小狐狸。'}
        </p>
        <div className="blog-about-location">
          <BlogMapPinIcon size={13} />
          {admin?.location || '森林小屋'}
        </div>
      </div>

      <div className="blog-about-section">
        <h2 className="blog-about-section-title">
          <BlogSparklesIcon size={18} />
          技能 & 兴趣
        </h2>
        <div className="blog-skills">
          {skills.map(skill => (
            <span key={skill} className="blog-skill-tag">{skill}</span>
          ))}
        </div>
      </div>

      <div className="blog-about-section">
        <h2 className="blog-about-section-title">
          <BlogLinkIcon size={18} />
          联系方式
        </h2>
        <div className="blog-social-links">
          {socialLinks.map(link => (
            <a key={link.name} className="blog-social-link" href={link.url} target="_blank" rel="noopener noreferrer">
              <span className="blog-social-link-icon">
                {link.icon === 'github' && <BlogGithubIcon size={18} />}
                {link.icon === 'mail' && <BlogMailIcon size={18} />}
                {link.icon === 'book' && <BlogBookOpenIcon size={18} />}
              </span>
              <span>{link.name}</span>
              <span className="blog-social-link-value">
                {link.url.replace(/^https?:\/\//, '').replace(/^mailto:/, '')}
              </span>
            </a>
          ))}
          {socialLinks.length === 0 && (
            <div style={{ color: 'var(--blog-text-tertiary)', fontSize: 14 }}>暂无联系方式</div>
          )}
        </div>
      </div>

      <div className="blog-site-info">
        <div style={{ marginBottom: 6 }}>
          <BlogPawIcon size={16} color="var(--blog-caramel-400)" />
        </div>
        <div>kings小wang的个人博客</div>
        <div style={{ marginTop: 4 }}>{siteAge()} · 自 {blogFormatDate(siteCreatedAt)}</div>
      </div>
    </div>
  );
}

const BlogSparklesIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2L12 3z"/>
    <path d="M19 15l.9 2.6L22.5 19l-2.6.9L19 22.5l-.9-2.6L15.5 19l2.6-.9L19 15.5z" opacity="0.7"/>
  </svg>
);

window.BlogAboutPage = BlogAboutPage;
window.BlogSparklesIcon = BlogSparklesIcon;
