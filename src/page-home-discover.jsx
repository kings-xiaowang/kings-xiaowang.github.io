// 首页（Hero + 项目预览）
function HomePage({ profile, stats, projects, onNavigate }) {
  const featuredProjects = projects.slice(0, 6);

  const handleScrollToDiscover = () => {
    onNavigate('discover');
  };

  return (
    <div>
      {/* Hero 区 */}
      <section className="hero-section">
        <div className="hero-bg-decoration">
          <div className="hero-paw paw-1">
            <PawIcon size={80} color="var(--color-caramel-600)" />
          </div>
          <div className="hero-paw paw-2">
            <PawIcon size={100} color="var(--color-mauve-500)" />
          </div>
          <div className="hero-paw paw-3">
            <PawIcon size={60} color="var(--color-mint-gold)" />
          </div>
          <div className="hero-paw paw-4">
            <PawIcon size={70} color="var(--color-caramel-500)" />
          </div>
        </div>

        <div className="hero-avatar">
          {getAvatarDisplay(profile?.avatar)}
        </div>

        <h1 className="hero-name">
          你好，我是 {profile?.nickname || '小狐狸'} 🦊
        </h1>
        <p className="hero-tagline">{profile?.bio || '一只热爱开源的小狐狸'}</p>

        <div className="hero-meta">
          {profile?.location && (
            <div className="hero-meta-item">
              <MapPinIcon size={14} />
              {profile.location}
            </div>
          )}
          {profile?.createdAt && (
            <div className="hero-meta-item">
              <CalendarIcon size={14} />
              加入于 {new Date(profile.createdAt).getFullYear()} 年
            </div>
          )}
        </div>

        <div className="hero-socials">
          {profile?.socialLinks?.map((link, idx) => (
            <a
              key={idx}
              className="hero-social-btn"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{getSocialIcon(link.platform)}</span>
              {link.platform}
            </a>
          ))}
          {profile?.email && (
            <a className="hero-social-btn" href={`mailto:${profile.email}`}>
              <span>📧</span>
              Email
            </a>
          )}
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{stats.projectCount}</div>
            <div className="hero-stat-label">项目总数</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{stats.categoryCount}</div>
            <div className="hero-stat-label">分类</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{formatNumber(stats.totalStars)}</div>
            <div className="hero-stat-label">总星标</div>
          </div>
        </div>

        <div className="hero-scroll-hint" onClick={handleScrollToDiscover}>
          <span>探索作品</span>
          <ChevronDownIcon size={20} />
        </div>
      </section>

      {/* 精选项目 */}
      <section className="section">
        <div className="section-header">
          <div className="section-decoration">
            <PawIcon size={20} />
          </div>
          <h2 className="section-title">精选项目</h2>
          <p className="section-subtitle">一些我最近在做的毛茸茸的小东西 🐾</p>
        </div>

        <div className="projects-grid">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onNavigate('detail', { id: project.id })}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            className="btn btn-secondary"
            style={{
              padding: '12px 28px',
              borderRadius: 'var(--radius-full)',
              fontSize: 15,
              fontWeight: 500,
              background: 'var(--color-cream-100)',
              border: '2px solid var(--color-caramel-200)',
            }}
            onClick={() => onNavigate('discover')}
          >
            查看全部项目
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

// 项目卡片
function ProjectCard({ project, onClick }) {
  const coverImage = project.images && project.images.length > 0 ? project.images[0] : null;

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-cover">
        {coverImage ? (
          <img src={coverImage} alt={project.name} loading="lazy" />
        ) : (
          <div className="project-card-cover-placeholder">
            <FolderIcon size={48} color="white" />
          </div>
        )}
      </div>
      <div className="project-card-body">
        <h3 className="project-card-title">{project.name}</h3>
        <p className="project-card-desc">{project.description}</p>
        <div className="project-card-tags">
          {project.category && (
            <span className="project-tag tag-category">{project.category}</span>
          )}
          {project.language && (
            <span className="project-tag tag-language">{project.language}</span>
          )}
        </div>
        <div className="project-card-footer">
          <div className="project-card-stats">
            <div className="project-card-stat">
              <StarIcon size={14} color="var(--color-mint-gold)" filled />
              {formatNumber(project.stars || 0)}
            </div>
          </div>
          <div className="project-card-date">
            {formatDate(project.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// 向下箭头图标
function ChevronDownIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

window.HomePage = HomePage;
window.ProjectCard = ProjectCard;
