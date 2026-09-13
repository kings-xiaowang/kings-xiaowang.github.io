// 管理后台 API - 纯前端 localStorage 版本

const MOCK_DELAY = 100;

function mockDelay(data) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), MOCK_DELAY);
  });
}

function mockError(message, delay = 100) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
}

// ========== 认证 API ==========
const AdminAuthAPI = {
  login(username, password) {
    if (!username || !password) {
      return mockError('请输入用户名和密码');
    }
    const admin = AdminDB.SessionStore.login(username, password);
    if (!admin) {
      return mockError('用户名或密码错误');
    }
    const { password: _, ...publicAdmin } = admin;
    return mockDelay({ message: '登录成功', admin: publicAdmin });
  },

  logout() {
    AdminDB.SessionStore.logout();
    return mockDelay({ message: '已退出登录' });
  },

  me() {
    const admin = AdminDB.SessionStore.getAdmin();
    if (!admin) {
      return mockError('未登录');
    }
    const { password: _, ...publicAdmin } = admin;
    return mockDelay({ admin: publicAdmin });
  },

  updateProfile(data) {
    const admin = AdminDB.SessionStore.getAdmin();
    if (!admin) return mockError('请先登录');
    const updates = {};
    if (data.nickname !== undefined) updates.nickname = data.nickname;
    if (data.avatar !== undefined) updates.avatar = data.avatar;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.location !== undefined) updates.location = data.location;
    if (data.email !== undefined) updates.email = data.email;
    if (data.blog !== undefined) updates.blog = data.blog;
    if (data.socialLinks !== undefined) updates.socialLinks = data.socialLinks;
    const updated = AdminDB.AdminStore.update(updates);
    const { password: _, ...publicAdmin } = updated;
    return mockDelay({ admin: publicAdmin });
  },

  changePassword(currentPassword, newPassword) {
    const admin = AdminDB.SessionStore.getAdmin();
    if (!admin) return mockError('请先登录');
    if (!newPassword || newPassword.length < 6) {
      return mockError('新密码至少需要 6 个字符');
    }
    const success = AdminDB.AdminStore.changePassword(currentPassword, newPassword);
    if (!success) {
      return mockError('当前密码错误');
    }
    return mockDelay({ message: '密码修改成功' });
  },

  uploadAvatar(file) {
    const admin = AdminDB.SessionStore.getAdmin();
    if (!admin) return mockError('请先登录');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const updated = AdminDB.AdminStore.update({ avatar: dataUrl });
        const { password: _, ...publicAdmin } = updated;
        setTimeout(() => resolve({ admin: publicAdmin }), MOCK_DELAY);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  },

  setPresetAvatar(presetId) {
    const admin = AdminDB.SessionStore.getAdmin();
    if (!admin) return mockError('请先登录');
    const avatarUrl = 'preset:' + presetId;
    const updated = AdminDB.AdminStore.update({ avatar: avatarUrl });
    const { password: _, ...publicAdmin } = updated;
    return mockDelay({ admin: publicAdmin });
  },

  getPresetAvatars() {
    return mockDelay({
      presets: [
        { id: 'fox', name: '小狐狸', emoji: '🦊' },
        { id: 'cat', name: '小猫咪', emoji: '🐱' },
        { id: 'wolf', name: '大灰狼', emoji: '🐺' },
        { id: 'rabbit', name: '兔兔', emoji: '🐰' },
        { id: 'bear', name: '熊熊', emoji: '🐻' },
        { id: 'dragon', name: '小龙', emoji: '🐉' },
      ]
    });
  },
};

// ========== 项目管理 API ==========
const AdminProjectsAPI = {
  list(params = {}) {
    let projects = AdminDB.ProjectStore.getAll();
    if (params.sort === 'updated') {
      projects = [...projects].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else if (params.sort === 'created') {
      projects = [...projects].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (params.sort === 'name') {
      projects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
    }
    return mockDelay({ projects });
  },

  search(query, filters) {
    const projects = AdminDB.ProjectStore.search(query, filters);
    return mockDelay({ projects });
  },

  get(id) {
    const project = AdminDB.ProjectStore.findById(id);
    if (!project) return mockError('项目不存在');
    return mockDelay({ project });
  },

  create(data) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    if (!data.name || data.name.trim().length === 0) {
      return mockError('项目名称不能为空');
    }
    const project = AdminDB.ProjectStore.create(data);
    return mockDelay({ project });
  },

  update(id, data) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    const project = AdminDB.ProjectStore.findById(id);
    if (!project) return mockError('项目不存在');
    const updated = AdminDB.ProjectStore.update(id, data);
    return mockDelay({ project: updated });
  },

  delete(id) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    const project = AdminDB.ProjectStore.findById(id);
    if (!project) return mockError('项目不存在');
    AdminDB.ProjectStore.delete(id);
    return mockDelay({ message: '删除成功' });
  },

  uploadImage(projectId, file) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const project = AdminDB.ProjectStore.findById(projectId);
        if (!project) return reject(new Error('项目不存在'));
        const images = [...(project.images || []), dataUrl];
        const updated = AdminDB.ProjectStore.update(projectId, { images });
        setTimeout(() => resolve({ project: updated, image: dataUrl }), MOCK_DELAY);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  },

  removeImage(projectId, imageIndex) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    const project = AdminDB.ProjectStore.findById(projectId);
    if (!project) return mockError('项目不存在');
    const images = [...(project.images || [])];
    images.splice(imageIndex, 1);
    const updated = AdminDB.ProjectStore.update(projectId, { images });
    return mockDelay({ project: updated });
  },

  uploadFile(projectId, file) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const project = AdminDB.ProjectStore.findById(projectId);
        if (!project) return reject(new Error('项目不存在'));
        const fileObj = {
          id: AdminDB.hashPassword(file.name + Date.now()).slice(0, 12),
          name: file.name,
          size: file.size,
          type: file.type,
          data: dataUrl,
          uploadedAt: Date.now(),
        };
        const files = [...(project.files || []), fileObj];
        const updated = AdminDB.ProjectStore.update(projectId, { files });
        setTimeout(() => resolve({ project: updated, file: fileObj }), MOCK_DELAY);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  },

  removeFile(projectId, fileId) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    const project = AdminDB.ProjectStore.findById(projectId);
    if (!project) return mockError('项目不存在');
    const files = (project.files || []).filter(f => f.id !== fileId);
    const updated = AdminDB.ProjectStore.update(projectId, { files });
    return mockDelay({ project: updated });
  },

  getMeta() {
    const categories = AdminDB.ProjectStore.getCategories();
    const languages = AdminDB.ProjectStore.getLanguages();
    const stats = AdminDB.ProjectStore.getStats();
    return mockDelay({ categories, languages, stats });
  },

  stats() {
    return mockDelay(AdminDB.ProjectStore.getStats());
  },

  recent(limit = 5) {
    const projects = [...AdminDB.ProjectStore.getAll()]
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit);
    return mockDelay({ projects });
  },
};

// ========== 数据管理 API ==========
const AdminDataAPI = {
  exportData() {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    const data = AdminDB.DataStore.exportAll();
    return mockDelay({ data });
  },

  importData(jsonData) {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const success = AdminDB.DataStore.importAll(data);
      if (!success) return mockError('导入失败，数据格式不正确');
      return mockDelay({ message: '导入成功' });
    } catch (e) {
      return mockError('导入失败：' + e.message);
    }
  },

  clearProjects() {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    AdminDB.DataStore.clearProjects();
    return mockDelay({ message: '项目数据已清空' });
  },

  resetAll() {
    if (!AdminDB.SessionStore.isLoggedIn()) return mockError('请先登录');
    AdminDB.DataStore.resetAll();
    return mockDelay({ message: '已重置为默认数据' });
  },
};

// ========== Toast 提示 ==========
let toastContainer = null;
function showToast(message, type = 'info') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'var(--color-forest-500)' : type === 'error' ? '#ef4444' : 'var(--color-caramel-600)';
  toast.style.cssText = `
    padding: 12px 20px; border-radius: var(--radius-lg);
    background: ${bgColor}; color: white; font-size: 14px;
    font-weight: 500; box-shadow: var(--shadow-lg);
    animation: toastSlideIn 0.3s ease-out;
    pointer-events: auto; min-width: 160px;
  `;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Toast 动画样式
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes toastSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes toastSlideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(toastStyle);

// 暴露到全局
Object.assign(window, {
  AdminAuthAPI, AdminProjectsAPI, AdminDataAPI,
  showToast,
});
