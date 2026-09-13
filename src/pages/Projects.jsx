// 项目管理页面
function ProjectsPage({ onNavigate, initialAction, initialId }) {
  const [projects, setProjects] = React.useState([]);
  const [filtered, setFiltered] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [languages, setLanguages] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterLanguage, setFilterLanguage] = React.useState('all');

  // 弹窗状态
  const [showModal, setShowModal] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState(null); // null = 新建

  // 确认弹窗
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  React.useEffect(() => {
    loadProjects();
  }, []);

  // 处理初始动作（从其他页面跳转过来）
  React.useEffect(() => {
    if (initialAction === 'new') {
      handleNew();
    } else if (initialAction === 'edit' && initialId) {
      // 等项目加载后再打开
      const timer = setTimeout(() => {
        const project = AdminDB.ProjectStore.findById(initialId);
        if (project) handleEdit(project);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialAction, initialId]);

  React.useEffect(() => {
    applyFilter();
  }, [searchQuery, filterCategory, filterLanguage, projects]);

  const loadProjects = async () => {
    const [listData, metaData] = await Promise.all([
      AdminProjectsAPI.list({ sort: 'updated' }),
      AdminProjectsAPI.getMeta(),
    ]);
    setProjects(listData.projects);
    setCategories(metaData.categories);
    setLanguages(metaData.languages);
  };

  const applyFilter = async () => {
    const data = await AdminProjectsAPI.search(searchQuery, {
      category: filterCategory,
      language: filterLanguage,
    });
    setFiltered(data.projects);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleNew = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDelete = (project) => {
    setConfirmDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!confirmDelete) return;
    try {
      await AdminProjectsAPI.delete(confirmDelete.id);
      showToast('项目已删除', 'success');
      setConfirmDelete(null);
      loadProjects();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleProjectSaved = () => {
    setShowModal(false);
    loadProjects();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">项目管理</h1>
            <p className="page-subtitle">管理你的所有项目，支持添加、编辑、删除</p>
          </div>
          <button className="btn btn-primary" onClick={handleNew}>
            <PlusIcon size={16} />
            添加项目
          </button>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="projects-toolbar">
        <div className="projects-search">
          <span className="projects-search-icon">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            placeholder="搜索项目名称、描述或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 140 }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 160 }}
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
        >
          <option value="all">全部语言</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* 表格 */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>项目名称</th>
              <th style={{ width: '15%' }}>分类</th>
              <th style={{ width: '12%' }}>编程语言</th>
              <th style={{ width: '15%' }}>创建时间</th>
              <th style={{ width: '15%' }}>更新时间</th>
              <th style={{ width: '15%', textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <div className="empty-state-icon">📁</div>
                    <div className="empty-state-text">
                      {projects.length === 0 ? '还没有项目，点击「添加项目」创建第一个吧～' : '没有找到匹配的项目'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="project-name-cell">
                      <div className="icon">
                        <FolderIcon size={14} color="white" />
                      </div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-category">{p.category || '未分类'}</span>
                  </td>
                  <td>
                    <span className="badge badge-language">{p.language}</span>
                  </td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td>{formatDate(p.updatedAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="icon-btn"
                        onClick={() => handleEdit(p)}
                        title="编辑"
                      >
                        <EditIcon size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => handleDelete(p)}
                        title="删除"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <ProjectFormModal
          project={editingProject}
          onClose={() => setShowModal(false)}
          onSaved={handleProjectSaved}
        />
      )}

      {/* 删除确认 */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="confirm-icon danger">
                <AlertIcon size={28} />
              </div>
              <div className="confirm-title">确认删除项目？</div>
              <div className="confirm-message">
                即将删除项目「{confirmDelete.name}」，此操作不可撤销。
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteProject}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 项目表单弹窗
function ProjectFormModal({ project, onClose, onSaved }) {
  const isEdit = !!project;
  const [form, setForm] = React.useState({
    name: project?.name || '',
    description: project?.description || '',
    category: project?.category || '前端开发',
    language: project?.language || 'JavaScript',
    topics: project?.topics?.join(', ') || '',
    linkUrl: project?.linkUrl || '',
    readme: project?.readme || '',
    images: project?.images || [],
    files: project?.files || [],
  });
  const [saving, setSaving] = React.useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!isEdit) {
      showToast('请先创建项目再上传图片', 'info');
      return;
    }
    for (const file of files) {
      try {
        const result = await AdminProjectsAPI.uploadImage(project.id, file);
        setForm((prev) => ({ ...prev, images: result.project.images || [] }));
      } catch (e) {
        showToast(e.message, 'error');
      }
    }
  };

  const handleRemoveImage = async (index) => {
    if (!isEdit) {
      setForm((prev) => {
        const images = [...prev.images];
        images.splice(index, 1);
        return { ...prev, images };
      });
      return;
    }
    try {
      const result = await AdminProjectsAPI.removeImage(project.id, index);
      setForm((prev) => ({ ...prev, images: result.project.images || [] }));
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!isEdit) {
      showToast('请先创建项目再上传文件', 'info');
      return;
    }
    for (const file of files) {
      try {
        const result = await AdminProjectsAPI.uploadFile(project.id, file);
        setForm((prev) => ({ ...prev, files: result.project.files || [] }));
      } catch (e) {
        showToast(e.message, 'error');
      }
    }
  };

  const handleRemoveFile = async (fileId) => {
    if (!isEdit) {
      setForm((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f.id !== fileId),
      }));
      return;
    }
    try {
      const result = await AdminProjectsAPI.removeFile(project.id, fileId);
      setForm((prev) => ({ ...prev, files: result.project.files || [] }));
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('项目名称不能为空', 'error');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        topics: form.topics
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (isEdit) {
        await AdminProjectsAPI.update(project.id, data);
        showToast('项目更新成功', 'success');
      } else {
        await AdminProjectsAPI.create(data);
        showToast('项目创建成功', 'success');
      }
      onSaved();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = ['前端开发', '后端开发', '效率工具', '创意设计', '游戏开发', '移动端', '未分类'];
  const languageOptions = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Vue', 'React', 'Java', 'C++', '其他'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '编辑项目' : '添加项目'}</div>
          <button className="modal-close" onClick={onClose}>
            <XIcon size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">项目名称 *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="my-project"
                />
              </div>
              <div className="form-group">
                <label className="form-label">分类</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label className="form-label">项目简介</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="一句话描述你的项目"
                />
              </div>
              <div className="form-group">
                <label className="form-label">编程语言</label>
                <select
                  className="form-select"
                  value={form.language}
                  onChange={(e) => updateField('language', e.target.value)}
                >
                  {languageOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">标签（逗号分隔）</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.topics}
                  onChange={(e) => updateField('topics', e.target.value)}
                  placeholder="ui, component, furry"
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">项目链接（GitHub/外部链接）</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.linkUrl}
                  onChange={(e) => updateField('linkUrl', e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">README 内容</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={form.readme}
                  onChange={(e) => updateField('readme', e.target.value)}
                  placeholder="# 项目标题&#10;&#10;项目详细介绍..."
                />
              </div>

              {/* 图片上传 */}
              <div className="form-group full-width">
                <label className="form-label">项目封面/截图</label>
                <div
                  className="image-upload-area"
                  onClick={() => document.getElementById('image-upload-input').click()}
                >
                  <div className="image-upload-icon">🖼️</div>
                  <div className="image-upload-text">点击上传图片（支持多图）</div>
                </div>
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                {form.images.length > 0 && (
                  <div className="image-preview-grid">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="image-preview-item">
                        <img src={img} alt={`image-${idx}`} />
                        <button
                          type="button"
                          className="image-preview-remove"
                          onClick={() => handleRemoveImage(idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 文件上传 */}
              <div className="form-group full-width">
                <label className="form-label">项目文件</label>
                <div
                  className="image-upload-area"
                  onClick={() => document.getElementById('file-upload-input').click()}
                >
                  <div className="image-upload-icon">📎</div>
                  <div className="image-upload-text">点击上传项目文件</div>
                </div>
                <input
                  id="file-upload-input"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                {form.files.length > 0 && (
                  <div className="file-list" style={{ marginTop: 12 }}>
                    {form.files.map((f) => (
                      <div key={f.id} className="file-item">
                        <FileIcon size={16} color="var(--color-text-tertiary)" />
                        <span className="file-name">{f.name}</span>
                        <span className="file-size">
                          {f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}
                        </span>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => handleRemoveFile(f.id)}
                          style={{ width: 28, height: 28 }}
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '保存中...' : (isEdit ? '保存修改' : '创建项目')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

window.ProjectsPage = ProjectsPage;
