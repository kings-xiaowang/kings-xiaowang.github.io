// 项目详情页
function ProjectDetailPage({ projectId, onNavigate }) {
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    // 模拟加载
    setTimeout(() => {
      const p = PawData.getProjectById(projectId);
      setProject(p);
      setLoading(false);
      window.scrollTo({ top: 0 });
    }, 200);
  }, [projectId]);

  if (loading) {
    return (
      <div className="detail-page">
        <LoadingState />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="detail-page">
        <div className="not-found">
          <div className="not-found-emoji">🦊❓</div>
          <div className="not-found-title">项目不存在</div>
          <div className="not-found-desc">这个项目可能已经被小狐狸藏起来了～</div>
          <button
            className="btn btn-secondary"
            style={{
              marginTop: 20,
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-cream-100)',
              border: '2px solid var(--color-caramel-200)',
            }}
            onClick={() => onNavigate('discover')}
          >
            返回项目列表
          </button>
        </div>
      </div>
    );
  }

  const coverImage = project.images && project.images.length > 0 ? project.images[0] : null;
  const galleryImages = project.images || [];
  const files = project.files || [];

  return (
    <div className="detail-page">
      {/* 面包屑 */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => onNavigate('home')}>
          首页
        </span>
        <ChevronRightIcon size={14} />
        <span className="breadcrumb-link" onClick={() => onNavigate('discover')}>
          项目
        </span>
        <ChevronRightIcon size={14} />
        <span>{project.name}</span>
      </div>

      {/* 项目头部 */}
      <div className="detail-header">
        <div className="detail-cover">
          {coverImage ? (
            <img src={coverImage} alt={project.name} />
          ) : (
            <div className="detail-cover-placeholder">
              <FolderIcon size={64} color="white" />
            </div>
          )}
        </div>
        <div className="detail-header-body">
          <h1 className="detail-title">{project.name}</h1>
          <p className="detail-desc">{project.description}</p>

          <div className="detail-tags">
            {project.category && (
              <span className="project-tag tag-category">{project.category}</span>
            )}
            {project.language && (
              <span className="project-tag tag-language">{project.language}</span>
            )}
            {project.topics?.slice(0, 4).map((t, i) => (
              <span key={i} className="project-tag" style={{
                background: 'var(--color-forest-100)',
                color: 'var(--color-forest-600)',
                fontSize: 12,
              }}>
                #{t}
              </span>
            ))}
          </div>

          <div className="detail-meta">
            <div className="detail-meta-item">
              <CalendarIcon size={14} />
              发布于 {formatDate(project.createdAt)}
            </div>
            <div className="detail-meta-item">
              <GitBranchIcon size={14} />
              更新于 {formatDate(project.updatedAt)}
            </div>
          </div>

          <div className="detail-stats">
            <div className="detail-stat">
              <div className="detail-stat-value">{formatNumber(project.stars || 0)}</div>
              <div className="detail-stat-label">⭐ 星标</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value">{formatNumber(project.views || 0)}</div>
              <div className="detail-stat-label">👁️ 浏览</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value">{(project.topics || []).length}</div>
              <div className="detail-stat-label">🏷️ 标签</div>
            </div>
            {files.length > 0 && (
              <div className="detail-stat">
                <div className="detail-stat-value">{files.length}</div>
                <div className="detail-stat-label">📁 文件</div>
              </div>
            )}
          </div>

          {project.linkUrl && (
            <a
              className="detail-link-btn"
              href={project.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkIcon size={16} />
              访问项目
              <ExternalLinkIcon size={14} />
            </a>
          )}
        </div>
      </div>

      {/* README */}
      {project.readme && (
        <div className="detail-section">
          <h2 className="detail-section-title">
            <BookIcon size={20} color="var(--color-caramel-700)" />
            README
          </h2>
          <div className="readme-content">
            {renderReadme(project.readme)}
          </div>
        </div>
      )}

      {/* 截图画廊 */}
      {galleryImages.length > 0 && (
        <div className="detail-section">
          <h2 className="detail-section-title">
            <ImageIcon size={20} color="var(--color-caramel-700)" />
            项目截图
          </h2>
          <div className="gallery-grid">
            {galleryImages.map((img, idx) => (
              <div key={idx} className="gallery-item">
                <img src={img} alt={`screenshot-${idx}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 文件下载 */}
      {files.length > 0 && (
        <div className="detail-section">
          <h2 className="detail-section-title">
            <FileIcon size={20} color="var(--color-caramel-700)" />
            项目文件
          </h2>
          <div className="files-list">
            {files.map((file) => (
              <a
                key={file.id}
                className="file-item"
                href={file.data || '#'}
                download={file.name}
              >
                <div className="file-item-icon">
                  <FileIcon size={20} />
                </div>
                <div className="file-item-info">
                  <div className="file-item-name">{file.name}</div>
                  <div className="file-item-size">
                    {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '下载'}
                  </div>
                </div>
                <DownloadIcon size={16} color="var(--color-caramel-600)" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 返回按钮 */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button className="back-btn" onClick={() => onNavigate('discover')}>
          <ChevronLeftIcon size={16} />
          返回项目列表
        </button>
      </div>
    </div>
  );
}

// 外链图标
function ExternalLinkIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

window.ProjectDetailPage = ProjectDetailPage;
