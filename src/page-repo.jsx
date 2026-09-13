// 项目详情页

function RepoDetailPage({
  projectId, onBack, onViewDetail, onViewProfile,
  user, onOpenLogin, starredProjects, onToggleStar, onProjectDeleted,
}) {
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('code');
  const [comments, setComments] = React.useState([]);
  const [commentText, setCommentText] = React.useState('');
  const [submittingComment, setSubmittingComment] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);

  const loadProject = () => {
    setLoading(true);
    ProjectsAPI.get(projectId).then(data => {
      setProject(data.project);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  };

  const loadComments = () => {
    CommentsAPI.list(projectId).then(data => {
      setComments(data.comments || []);
    }).catch(() => {});
  };

  React.useEffect(() => {
    loadProject();
    loadComments();
  }, [projectId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenLogin();
      return;
    }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await CommentsAPI.create(projectId, commentText.trim());
      setCommentText('');
      loadComments();
      showToast('评论发表成功 🎉', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) return;
    try {
      await ProjectsAPI.delete(projectId);
      showToast('项目已删除', 'info');
      if (onProjectDeleted) onProjectDeleted();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const starred = starredProjects.includes(projectId);
  const isOwner = user && project && user.id === project.ownerId;

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        <PawIcon size={28} color="var(--color-caramel-400)" />
        <div style={{ marginTop: 10, fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">😿</div>
        <div className="empty-state-text">项目不见了...</div>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 16 }}>
          返回项目列表
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'code', label: '代码', icon: <CodeIcon size={16} color="currentColor" />, count: project.files?.length || 0 },
    { id: 'readme-tab', label: 'README', icon: <BookOpenIcon size={16} color="currentColor" /> },
    { id: 'comments', label: '评论', icon: <ChatIcon size={16} color="currentColor" />, count: comments.length },
  ];

  return (
    <div>
      {/* 面包屑 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 16, fontSize: 13, color: 'var(--color-text-tertiary)',
      }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 8 }}>
          <ChevronLeftIcon size={14} color="currentColor" />
          返回
        </button>
        <span>探索</span>
        <ChevronLeftIcon size={10} color="currentColor" style={{ transform: 'rotate(180deg)' }} />
        <span
          style={{ color: 'var(--color-caramel-600)', cursor: 'pointer' }}
          onClick={() => onViewProfile && onViewProfile(project.owner?.username)}
        >
          {project.owner?.username}
        </span>
        <ChevronLeftIcon size={10} color="currentColor" style={{ transform: 'rotate(180deg)' }} />
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{project.name}</span>
      </div>

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
          <div style={{ display: 'flex', gap: 8 }}>
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
            {isOwner && (
              <>
                <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
                  编辑项目
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ color: '#d9534f' }}
                  onClick={handleDeleteProject}
                >
                  删除
                </button>
              </>
            )}
          </div>
        </div>

        <p className="repo-detail-desc">{project.desc}</p>

        {/* 话题标签 */}
        {project.topics && project.topics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {project.topics.map(topic => (
              <span key={topic} className="topic-tag">#{topic}</span>
            ))}
          </div>
        )}

        <div className="repo-detail-stats">
          <div className="repo-detail-stat">
            <StarIcon size={14} color="currentColor" />
            {project.stars} 星标
          </div>
          <div className="repo-detail-stat">
            <span className="lang-dot" style={{ background: project.langColor }}></span>
            {project.language || '未指定'}
          </div>
          <div className="repo-detail-stat">
            <CalendarIcon size={14} color="currentColor" />
            创建于 {formatFullDate(project.createdAt)}
          </div>
          <div className="repo-detail-stat">
            更新于 {formatDate(project.updatedAt)}
          </div>
        </div>
      </div>

      {/* 发布者信息卡 */}
      {project.owner && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 20px',
            background: 'var(--color-bg-card)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
            cursor: 'pointer',
          }}
          onClick={() => onViewProfile && onViewProfile(project.owner.username)}
        >
          <div style={{
            width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
            background: 'var(--color-caramel-200)', flexShrink: 0,
          }}>
            {project.owner.avatar ? (
              <img src={project.owner.avatar} alt={project.owner.username}
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 600, color: 'var(--color-caramel-600)',
                fontFamily: 'var(--font-display)',
              }}>{project.owner.username?.[0]?.toUpperCase()}</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
              color: 'var(--color-text-primary)',
            }}>
              {project.owner.username}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              {project.owner.bio ? project.owner.bio.slice(0, 50) : '项目作者'}
              {project.owner.bio && project.owner.bio.length > 50 ? '...' : ''}
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-caramel-600)' }}>
            查看主页 →
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 内容 */}
      {activeTab === 'code' && (
        <div>
          <FileList files={project.files || []} />
          {project.readme && (
            <div className="readme-card">
              <div className="readme-header">
                <BookOpenIcon size={16} color="var(--color-caramel-800)" />
                README.md
              </div>
              <div
                className="readme-body"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(project.readme) }}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'readme-tab' && (
        <div className="readme-card">
          <div className="readme-header">
            <BookOpenIcon size={16} color="var(--color-caramel-800)" />
            README.md
          </div>
          {project.readme ? (
            <div
              className="readme-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(project.readme) }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              这个项目还没有 README
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="sidebar-card" style={{ padding: 20 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
            color: 'var(--color-text-primary)', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <ChatIcon size={18} color="var(--color-caramel-600)" />
            评论区
            <span style={{
              fontSize: 13, fontWeight: 400, color: 'var(--color-text-tertiary)',
            }}>({comments.length})</span>
          </h3>

          {/* 发表评论 */}
          <form onSubmit={handleSubmitComment} style={{ marginBottom: 20 }}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? '说点什么吧～' : '登录后发表评论'}
              rows={3}
              disabled={!user && true}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={() => { if (!user) onOpenLogin(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!user || !commentText.trim() || submittingComment}
                style={{ padding: '6px 18px', fontSize: 13 }}
              >
                {submittingComment ? '发表中...' : '发表评论'}
              </button>
            </div>
          </form>

          {/* 评论列表 */}
          {comments.length === 0 ? (
            <div style={{
              padding: '40px 0', textAlign: 'center',
              color: 'var(--color-text-tertiary)', fontSize: 13,
            }}>
              还没有评论，来抢沙发吧～ 🐾
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.map(comment => (
                <div key={comment.id} style={{
                  display: 'flex', gap: 12,
                  padding: '14px',
                  background: 'var(--color-bg-soft)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                      background: 'var(--color-caramel-200)', flexShrink: 0,
                      cursor: comment.user ? 'pointer' : 'default',
                    }}
                    onClick={() => comment.user && onViewProfile && onViewProfile(comment.user.username)}
                  >
                    {comment.user?.avatar ? (
                      <img src={comment.user.avatar} alt={comment.user.username}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 600, color: 'var(--color-caramel-600)',
                        fontFamily: 'var(--font-display)',
                      }}>{comment.user?.username?.[0]?.toUpperCase() || '?'}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 4,
                    }}>
                      <span
                        style={{
                          fontWeight: 600, fontSize: 13,
                          color: 'var(--color-text-primary)',
                          cursor: comment.user ? 'pointer' : 'default',
                        }}
                        onClick={() => comment.user && onViewProfile && onViewProfile(comment.user.username)}
                      >
                        {comment.user?.username || '匿名用户'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 13, color: 'var(--color-text-secondary)',
                      lineHeight: 1.6, wordBreak: 'break-word',
                    }}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 编辑项目弹窗 */}
      {showEdit && (
        <ProjectEditModal
          project={project}
          onClose={() => setShowEdit(false)}
          onUpdated={(updatedProject) => {
            setProject(updatedProject);
            setShowEdit(false);
            showToast('项目已更新 ✨', 'success');
          }}
        />
      )}
    </div>
  );
}

// 项目编辑弹窗
function ProjectEditModal({ project, onClose, onUpdated }) {
  const [name, setName] = React.useState(project.name);
  const [desc, setDesc] = React.useState(project.desc);
  const [language, setLanguage] = React.useState(project.language);
  const [topics, setTopics] = React.useState((project.topics || []).join(', '));
  const [readme, setReadme] = React.useState(project.readme || '');
  const [icon, setIcon] = React.useState(project.icon || 'paw');
  const [saving, setSaving] = React.useState(false);
  const [uploadingFile, setUploadingFile] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const icons = ['paw', 'tracker', 'terminal', 'chat', 'book', 'art', 'palette', 'server'];
  const languages = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Vue', 'React', 'CSS', 'HTML', 'JSON', 'Java', 'C++', '其他'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('项目名称不能为空', 'error'); return; }
    setSaving(true);
    try {
      const data = await ProjectsAPI.update(project.id, {
        name: name.trim(),
        desc: desc.trim(),
        language,
        langColor: project.langColor,
        icon,
        topics: topics.split(',').map(t => t.trim()).filter(Boolean),
        readme,
      });
      onUpdated(data.project);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} 超过 5MB，已跳过`, 'error');
        continue;
      }
      setUploadingFile(true);
      try {
        await ProjectsAPI.uploadFile(project.id, file);
        // 刷新项目数据
        const data = await ProjectsAPI.get(project.id);
        onUpdated(data.project);
        showToast(`${file.name} 上传成功`, 'success');
      } catch (err) {
        showToast(`${file.name} 上传失败: ${err.message}`, 'error');
      } finally {
        setUploadingFile(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)',
          }}>编辑项目</h2>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: 'var(--color-text-tertiary)',
          }} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={formLabelStyle}>项目名称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={formInputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={formLabelStyle}>图标</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {icons.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  style={{
                    width: 36, height: 36,
                    borderRadius: 'var(--radius-md)',
                    border: icon === i ? '2px solid var(--color-caramel-500)' : '2px solid var(--color-border)',
                    background: icon === i ? 'var(--color-caramel-100)' : 'var(--color-bg-card)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {getProjectIcon(i, 16, icon === i ? 'var(--color-caramel-700)' : 'var(--color-text-tertiary)')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={formLabelStyle}>项目简介</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              rows={3} style={{ ...formInputStyle, resize: 'vertical', minHeight: 60 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={formLabelStyle}>编程语言</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              style={{ ...formInputStyle, cursor: 'pointer' }}>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={formLabelStyle}>话题标签（用逗号分隔）</label>
            <input type="text" value={topics} onChange={(e) => setTopics(e.target.value)}
              placeholder="furry, react, ui" style={formInputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={formLabelStyle}>README</label>
            <textarea value={readme} onChange={(e) => setReadme(e.target.value)}
              rows={8} placeholder="支持 Markdown 格式"
              style={{ ...formInputStyle, resize: 'vertical', minHeight: 150, fontFamily: 'monospace', fontSize: 12 }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={formLabelStyle}>上传文件</label>
            <div style={{
              padding: 16, border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)', textAlign: 'center',
              background: 'var(--color-bg-soft)',
            }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button type="button" className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                style={{ marginBottom: 8 }}
              >
                <UploadIcon size={14} color="currentColor" />
                {uploadingFile ? '上传中...' : '选择文件上传'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                支持多文件上传，单个文件最大 5MB
              </div>
              {project.files && project.files.length > 0 && (
                <div style={{
                  marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)',
                  textAlign: 'left',
                }}>
                  当前文件数：{project.files.length}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 暴露到全局
Object.assign(window, { RepoDetailPage, ProjectEditModal });
