// PawBlog 管理后台（IndexedDB 版）- 文章管理 + 数据管理

function BlogAdminPage({ onNavigate }) {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [posts, setPosts] = React.useState([]);
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [loginForm, setLoginForm] = React.useState({ username: 'admin', password: '' });
  const [loginError, setLoginError] = React.useState('');
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('articles'); // articles | data
  const [storageInfo, setStorageInfo] = React.useState(null);
  const [showDataPanel, setShowDataPanel] = React.useState(false);
  const [showConfirmClear, setShowConfirmClear] = React.useState(false);
  const [importInput, setImportInput] = React.useState(null);
  const fileInputRef = React.useRef(null);

  // 导出网站源码
  const [exportingWebsite, setExportingWebsite] = React.useState(false);
  const [exportedWebsiteInfo, setExportedWebsiteInfo] = React.useState(null);

  const handleExportWebsite = async () => {
    setExportingWebsite(true);
    setExportedWebsiteInfo(null);
    blogShowToast('正在打包网站源码...', 'info');
    try {
      const result = await PawExport.exportWebsite();
      setExportedWebsiteInfo(result);
      blogShowToast(`导出成功，共 ${result.fileCount} 个文件`, 'success');
    } catch (err) {
      console.error('导出网站失败:', err);
      blogShowToast('导出失败: ' + err.message, 'error');
    } finally {
      setExportingWebsite(false);
    }
  };

  // 数据源设置相关
  const [remoteUrl, setRemoteUrlState] = React.useState('');
  const [remoteUrlInput, setRemoteUrlInput] = React.useState('');
  const [remoteStatus, setRemoteStatus] = React.useState(null); // { type, message }
  const [syncing, setSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState(null);
  const [remoteArticleCount, setRemoteArticleCount] = React.useState(0);

  // Gist 自动同步相关
  const [githubToken, setGithubTokenState] = React.useState('');
  const [githubTokenInput, setGithubTokenInput] = React.useState('');
  const [hasToken, setHasToken] = React.useState(false);
  const [pushingToGist, setPushingToGist] = React.useState(false);
  const [lastPushToGist, setLastPushToGist] = React.useState(null);
  const [unsyncedCount, setUnsyncedCount] = React.useState(0);
  const [autoSyncEnabled, setAutoSyncState] = React.useState(false);
  const [gistInfo, setGistInfo] = React.useState({ gistId: null, filename: null, isValid: false, gistPageUrl: null });

  React.useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    await PawDB.ensureReady();
    const isLoggedIn = PawDB.isLoggedIn();
    setLoggedIn(isLoggedIn);
    if (isLoggedIn) {
      loadPosts();
      loadStorageInfo();
      loadRemoteSettings();
    }
  };

  const loadPosts = async () => {
    const all = await PawDB.getArticles(false);
    setPosts(all.sort((a, b) => b.createdAt - a.createdAt));
  };

  const loadStorageInfo = async () => {
    const info = await PawDB.getStorageUsage();
    setStorageInfo(info);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const admin = await PawDB.login(
        loginForm.username.trim(),
        loginForm.password
      );
      if (!admin) {
        setLoginError('用户名或密码错误');
        return;
      }
      setLoggedIn(true);
      loadPosts();
      loadStorageInfo();
      blogShowToast('欢迎回来，管理员～', 'success');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    PawDB.logout();
    setLoggedIn(false);
    blogShowToast('已退出登录', 'info');
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleSavePost = async (postData, opts) => {
    let savedPost;
    if (editingPost) {
      savedPost = await PawDB.updateArticle(editingPost.id, postData);
      blogShowToast('文章已更新', 'success');
    } else {
      savedPost = await PawDB.createArticle(postData);
      if (opts?.pendingFiles && opts.pendingFiles.length > 0) {
        for (const fileId of opts.pendingFiles) {
          try { await PawDB.setFilePostId(fileId, savedPost.id); } catch (e) { /* ignore */ }
        }
      }
      blogShowToast('文章已发布', 'success');
    }
    setShowEditor(false);
    loadPosts();
    loadStorageInfo();
    // 如果开启了自动同步，后台同步到 Gist
    tryAutoSyncToGist();
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    await PawDB.deleteArticle(confirmDelete.id);
    blogShowToast('文章已删除', 'success');
    setConfirmDelete(null);
    loadPosts();
    loadStorageInfo();
  };

  // ========== 数据源设置 ==========
  const loadRemoteSettings = async () => {
    const url = await PawRemote.getRemoteUrl();
    setRemoteUrlState(url);
    // 未配置时显示默认值
    setRemoteUrlInput(url || PawRemote.getDefaultRemoteUrl());
    const last = await PawRemote.getLastSyncInfo();
    setLastSync(last);
    if (last?.articleCount != null) {
      setRemoteArticleCount(last.articleCount);
    }

    // 加载 Gist 同步相关设置
    const token = await PawRemote.getGithubToken();
    setHasToken(!!token);
    setGithubTokenState(token);
    // 用户未保存过 Token 时，预填预设 Token 到输入框，方便用户直接点保存
    if (!token) {
      const presetToken = PawRemote.getPresetGithubToken();
      setGithubTokenInput(presetToken);
    } else {
      // 已有 Token 不回显，保持安全
      setGithubTokenInput('');
    }

    const lp = await PawRemote.getLastPushToGist();
    setLastPushToGist(lp);

    const unsynced = await PawRemote.getUnsavedArticleCount();
    setUnsyncedCount(unsynced.count);

    const autoSync = await PawRemote.getAutoSyncEnabled();
    setAutoSyncState(autoSync);

    const gi = await PawRemote.getGistInfo();
    setGistInfo(gi);
  };

  const handleRestoreDefault = async () => {
    setRemoteUrlInput(PawRemote.getDefaultRemoteUrl());
    const ok = await PawRemote.setRemoteUrl('');
    if (ok) {
      setRemoteUrlState('');
      setRemoteStatus({ type: 'success', message: '已恢复为默认数据源' });
      setLastSync(null);
      setRemoteArticleCount(0);
      PawRemote.clearRemoteCache();
    } else {
      setRemoteStatus({ type: 'error', message: '恢复失败' });
    }
  };

  const handleSaveRemoteUrl = async () => {
    const url = remoteUrlInput.trim();
    if (url && !url.startsWith('http')) {
      setRemoteStatus({ type: 'error', message: 'URL 必须以 http:// 或 https:// 开头' });
      return;
    }
    const ok = await PawRemote.setRemoteUrl(url);
    if (ok) {
      setRemoteUrlState(url);
      setRemoteStatus({ type: 'success', message: '数据源地址已保存' });
      // 清空上次同步状态
      setLastSync(null);
      setRemoteArticleCount(0);
      PawRemote.clearRemoteCache();
    } else {
      setRemoteStatus({ type: 'error', message: '保存失败' });
    }
  };

  const handleSyncNow = async () => {
    if (!remoteUrlInput.trim()) {
      setRemoteStatus({ type: 'error', message: '请先填写并保存数据源地址' });
      return;
    }
    setSyncing(true);
    setRemoteStatus({ type: 'info', message: '正在同步...' });
    try {
      const result = await PawRemote.loadRemoteData({ force: true });
      if (result.success) {
        const count = result.data?.articles?.length || 0;
        setRemoteArticleCount(count);

        // 把远程数据同步到本地 IndexedDB（文章、博主信息、设置）
        let syncToLocalResult = null;
        try {
          syncToLocalResult = await PawRemote.syncRemoteToLocal(result.data);
        } catch (syncErr) {
          console.warn('同步到本地失败:', syncErr);
        }

        const info = {
          syncedAt: Date.now(),
          articleCount: count,
          status: 'success',
        };
        await PawRemote.setLastSyncInfo(info);
        setLastSync(info);

        let msg = `同步成功，共 ${count} 篇文章`;
        if (syncToLocalResult) {
          msg = `同步成功，已更新 ${syncToLocalResult.articleCount} 篇文章和博主信息`;
        }
        setRemoteStatus({ type: 'success', message: msg });
        // 刷新本地数据展示
        if (syncToLocalResult) {
          loadPosts();
          loadStorageInfo();
        }
      } else {
        setRemoteStatus({
          type: 'error',
          message: '同步失败：' + (result.error || '未知错误'),
        });
      }
    } catch (err) {
      setRemoteStatus({ type: 'error', message: '同步失败：' + err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportRemoteFormat = async () => {
    try {
      blogShowToast('正在生成导出文件...', 'info');
      const data = await PawRemote.exportRemoteFormat();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pawblog-data-${blogFormatDateShort(Date.now())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      blogShowToast('导出成功', 'success');
    } catch (err) {
      console.error('导出失败:', err);
      blogShowToast('导出失败: ' + err.message, 'error');
    }
  };

  // ========== Gist 自动同步 ==========
  const handleSaveGithubToken = async () => {
    // 输入框为空且已有 Token：不修改
    if (!githubTokenInput.trim() && hasToken) {
      setRemoteStatus({ type: 'info', message: 'Token 未变更' });
      return;
    }
    const token = githubTokenInput.trim();
    if (!token) {
      setRemoteStatus({ type: 'error', message: '请输入 GitHub Personal Access Token' });
      return;
    }
    const ok = await PawRemote.setGithubToken(token);
    if (ok) {
      setHasToken(true);
      setGithubTokenState(token);
      setGithubTokenInput('');
      setRemoteStatus({ type: 'success', message: 'GitHub Token 已保存' });
      // 刷新 Gist 信息
      const gi = await PawRemote.getGistInfo();
      setGistInfo(gi);
    } else {
      setRemoteStatus({ type: 'error', message: '保存失败' });
    }
  };

  const handleClearGithubToken = async () => {
    if (!confirm('确定要清除 GitHub Token 吗？清除后将无法自动同步到 Gist。')) return;
    const ok = await PawRemote.clearGithubToken();
    if (ok) {
      setHasToken(false);
      setGithubTokenState('');
      setGithubTokenInput('');
      setRemoteStatus({ type: 'success', message: 'Token 已清除' });
    }
  };

  const handlePushToGist = async () => {
    if (!hasToken) {
      setRemoteStatus({ type: 'error', message: '请先配置 GitHub Token' });
      return;
    }
    if (!gistInfo?.isValid) {
      setRemoteStatus({ type: 'error', message: '当前数据源不是有效的 Gist 链接，请先设置正确的数据源 URL' });
      return;
    }
    setPushingToGist(true);
    setRemoteStatus({ type: 'info', message: '正在推送到 Gist...' });
    try {
      const result = await PawRemote.syncToGist();
      setLastPushToGist(result);
      setUnsyncedCount(0);
      setRemoteStatus({ type: 'success', message: `同步成功！已更新 ${result.articleCount} 篇文章到 Gist` });
      blogShowToast('已同步到 Gist', 'success');
    } catch (err) {
      console.error('推送到 Gist 失败:', err);
      setRemoteStatus({ type: 'error', message: '同步失败：' + err.message });
      blogShowToast('同步 Gist 失败: ' + err.message, 'error');
    } finally {
      setPushingToGist(false);
    }
  };

  const handleToggleAutoSync = async (enabled) => {
    if (enabled && !hasToken) {
      blogShowToast('请先配置 GitHub Token', 'error');
      return;
    }
    const ok = await PawRemote.setAutoSyncEnabled(enabled);
    if (ok) {
      setAutoSyncState(enabled);
      blogShowToast(enabled ? '已开启自动同步' : '已关闭自动同步', 'success');
    }
  };

  // 保存文章后自动同步（如果开启了自动同步）
  const tryAutoSyncToGist = async () => {
    if (!autoSyncEnabled || !hasToken || !gistInfo?.isValid) return;
    try {
      const result = await PawRemote.syncToGist({ silent: true });
      setLastPushToGist(result);
      setUnsyncedCount(0);
      blogShowToast('已自动同步到 Gist', 'success');
    } catch (err) {
      console.warn('自动同步到 Gist 失败:', err);
      blogShowToast('自动同步 Gist 失败: ' + err.message, 'error');
    }
  };
  const handleExportData = async () => {
    try {
      blogShowToast('正在导出数据...', 'info');
      const data = await PawDB.exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pawblog-backup-${blogFormatDateShort(Date.now())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      blogShowToast('数据导出成功', 'success');
    } catch (err) {
      console.error('导出失败:', err);
      blogShowToast('导出失败: ' + err.message, 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!confirm('导入数据将覆盖当前所有文章和文件，确定继续吗？')) return;

    try {
      blogShowToast('正在导入数据...', 'info');
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await PawDB.importAllData(data, { clearFirst: true });
      blogShowToast(`导入成功：${result.articles} 篇文章，${result.files} 个文件`, 'success');
      loadPosts();
      loadStorageInfo();
    } catch (err) {
      console.error('导入失败:', err);
      blogShowToast('导入失败: ' + err.message, 'error');
    }
  };

  const handleClearAllData = async () => {
    try {
      await PawDB.clearAllData();
      blogShowToast('数据已清空，已恢复默认设置', 'success');
      setShowConfirmClear(false);
      loadPosts();
      loadStorageInfo();
    } catch (err) {
      blogShowToast('清空失败: ' + err.message, 'error');
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('确定要重置为默认数据吗？\n\n所有文章、文件和设置都会被清除，并恢复为初始的默认数据（含示例文章和默认博主信息 kings小wang）。\n\n此操作不可撤销，建议先备份。')) return;
    try {
      blogShowToast('正在重置...', 'info');
      await PawDB.clearAllData();
      blogShowToast('已重置为默认数据，页面即将刷新', 'success');
      setShowConfirmClear(false);
      // 1.5 秒后刷新页面，确保所有 state 重新加载
      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err) {
      blogShowToast('重置失败: ' + err.message, 'error');
    }
  };

  // ========== 渲染 ==========
  if (!loggedIn) {
    return (
      <div className="blog-page">
        <div className="blog-login-wrap">
          <div className="blog-login-card">
            <div className="blog-login-logo">
              <div className="blog-login-icon">
                <BlogPawIcon size={28} color="white" />
              </div>
              <div className="blog-login-title">管理后台</div>
              <div className="blog-login-subtitle">kings小wang的个人博客</div>
            </div>

            <form onSubmit={handleLogin}>
              {loginError && (
                <div className="blog-login-error">{loginError}</div>
              )}
              <div className="blog-form-group">
                <label className="blog-form-label">用户名</label>
                <input
                  className="blog-form-input"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="请输入用户名"
                  autoFocus
                />
              </div>
              <div className="blog-form-group">
                <label className="blog-form-label">密码</label>
                <input
                  className="blog-form-input"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="请输入密码"
                />
              </div>
              <button
                type="submit"
                className="blog-btn blog-btn-primary blog-btn-full"
                disabled={loginLoading}
              >
                {loginLoading ? '登录中...' : '登 录'}
              </button>
            </form>

            <div className="blog-login-hint">
              默认账号：admin / admin123
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                className="blog-btn blog-btn-secondary blog-btn-sm"
                onClick={() => onNavigate('home')}
              >
                <BlogArrowLeftIcon size={14} /> 返回博客
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page blog-admin-layout">
      <div className="blog-admin-header">
        <div>
          <h1 className="blog-admin-title">管理后台</h1>
          <div className="blog-admin-subtitle">共 {posts.length} 篇文章</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="blog-btn blog-btn-secondary blog-btn-sm" onClick={() => onNavigate('home')}>
            <BlogHomeIcon size={14} /> 查看博客
          </button>
          <button className="blog-btn blog-btn-primary" onClick={handleNewPost}>
            <BlogPlusIcon size={16} /> 写新文章
          </button>
          <button className="blog-btn blog-btn-secondary blog-btn-sm" onClick={handleLogout}>
            <BlogLogoutIcon size={14} /> 退出
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="blog-admin-tabs">
        <button
          className={`blog-admin-tab ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          <BlogBookOpenIcon size={16} /> 文章管理
        </button>
        <button
          className={`blog-admin-tab ${activeTab === 'remote' ? 'active' : ''}`}
          onClick={() => { setActiveTab('remote'); loadRemoteSettings(); }}
        >
          <BlogGlobeIcon size={16} /> 数据源设置
        </button>
        <button
          className={`blog-admin-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => { setActiveTab('data'); loadStorageInfo(); }}
        >
          <BlogDatabaseIcon size={16} /> 数据管理
        </button>
      </div>

      {activeTab === 'articles' && (
        <>
          {posts.length === 0 ? (
            <div className="blog-empty">
              <div className="blog-empty-emoji">✍️</div>
              <div className="blog-empty-title">还没有文章</div>
              <div className="blog-empty-desc">点击右上角「写新文章」开始创作吧</div>
            </div>
          ) : (
            <div className="blog-admin-post-list">
              {posts.map(post => (
                <div key={post.id} className="blog-admin-post-item">
                  <div className="blog-admin-post-info">
                    <div className="blog-admin-post-title">
                      {post.published === false && <span style={{ color: 'var(--blog-text-tertiary)' }}>[草稿] </span>}
                      {post.title}
                    </div>
                    <div className="blog-admin-post-meta">
                      <span>{blogFormatDate(post.createdAt)}</span>
                      <span>{post.category}</span>
                      <span>{PawDB.estimateReadingTime(post.content)} 分钟阅读</span>
                    </div>
                  </div>
                  <div className="blog-admin-post-actions">
                    <button
                      className="blog-btn blog-btn-secondary blog-btn-sm"
                      onClick={() => onNavigate('post', { id: post.id })}
                    >
                      预览
                    </button>
                    <button
                      className="blog-btn blog-btn-secondary blog-btn-sm"
                      onClick={() => handleEditPost(post)}
                    >
                      <BlogEditIcon size={13} /> 编辑
                    </button>
                    <button
                      className="blog-btn blog-btn-danger blog-btn-sm"
                      onClick={() => setConfirmDelete(post)}
                    >
                      <BlogTrashIcon size={13} /> 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

        {activeTab === 'remote' && (
        <BlogRemotePanel
          remoteUrl={remoteUrl}
          remoteUrlInput={remoteUrlInput}
          setRemoteUrlInput={setRemoteUrlInput}
          remoteStatus={remoteStatus}
          syncing={syncing}
          lastSync={lastSync}
          remoteArticleCount={remoteArticleCount}
          onSave={handleSaveRemoteUrl}
          onSync={handleSyncNow}
          onExport={handleExportRemoteFormat}
          onRestoreDefault={handleRestoreDefault}
          hasToken={hasToken}
          githubTokenInput={githubTokenInput}
          setGithubTokenInput={setGithubTokenInput}
          onSaveToken={handleSaveGithubToken}
          onClearToken={handleClearGithubToken}
          pushingToGist={pushingToGist}
          onPushToGist={handlePushToGist}
          lastPushToGist={lastPushToGist}
          unsyncedCount={unsyncedCount}
          autoSyncEnabled={autoSyncEnabled}
          onToggleAutoSync={handleToggleAutoSync}
          gistInfo={gistInfo}
        />
      )}

      {activeTab === 'data' && (
        <BlogDataPanel
          storageInfo={storageInfo}
          onExport={handleExportData}
          onImport={handleImportClick}
          onClear={() => setShowConfirmClear(true)}
          onResetToDefault={handleResetToDefault}
          onRefresh={loadStorageInfo}
          onExportWebsite={handleExportWebsite}
          exportingWebsite={exportingWebsite}
          exportedWebsiteInfo={exportedWebsiteInfo}
        />
      )}

      {/* 隐藏的 file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* 编辑器 */}
      {showEditor && (
        <BlogPostEditor
          post={editingPost}
          onSave={handleSavePost}
          onClose={() => { setShowEditor(false); loadPosts(); }}
        />
      )}

      {/* 删除文章确认 */}
      {confirmDelete && (
        <div className="blog-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="blog-modal blog-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="blog-confirm-icon">🗑️</div>
            <div className="blog-confirm-title">确认删除这篇文章？</div>
            <div className="blog-confirm-desc">
              「{confirmDelete.title}」删除后，关联的图片和附件也会一并删除，无法恢复。
            </div>
            <div className="blog-confirm-buttons">
              <button
                className="blog-btn blog-btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                取消
              </button>
              <button
                className="blog-btn blog-btn-danger"
                onClick={handleDeleteConfirm}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清空数据确认 */}
      {showConfirmClear && (
        <div className="blog-modal-overlay" onClick={() => setShowConfirmClear(false)}>
          <div className="blog-modal blog-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="blog-confirm-icon">⚠️</div>
            <div className="blog-confirm-title">确定清空所有数据？</div>
            <div className="blog-confirm-desc">
              这将删除所有文章、图片、附件和设置，仅保留管理员账号。
              <br /><strong>此操作不可恢复，请先导出备份！</strong>
            </div>
            <div className="blog-confirm-buttons">
              <button
                className="blog-btn blog-btn-secondary"
                onClick={() => setShowConfirmClear(false)}
              >
                取消
              </button>
              <button
                className="blog-btn blog-btn-danger"
                onClick={handleClearAllData}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 数据源设置面板组件
function BlogRemotePanel({
  remoteUrl,
  remoteUrlInput,
  setRemoteUrlInput,
  remoteStatus,
  syncing,
  lastSync,
  remoteArticleCount,
  onSave,
  onSync,
  onExport,
  onRestoreDefault,
  // Gist 同步相关
  hasToken,
  githubTokenInput,
  setGithubTokenInput,
  onSaveToken,
  onClearToken,
  pushingToGist,
  onPushToGist,
  lastPushToGist,
  unsyncedCount,
  autoSyncEnabled,
  onToggleAutoSync,
  gistInfo,
}) {
  const isConfigured = true; // 总有默认值，所以总是已配置
  const isUsingDefault = !remoteUrl;

  return (
    <div className="blog-data-panel">
      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogGlobeIcon size={18} />
          远程数据源
        </div>
        <p style={{ fontSize: 13, color: 'var(--blog-text-secondary)', lineHeight: 1.8, margin: '0 0 18px 0' }}>
          配置一个公开的 JSON URL（如 GitHub Gist raw 链接），访客访问网站时会从该地址加载文章数据。
          <br />
          这样你只需在本地写好文章，导出 JSON 后上传到 Gist，其他人就能看到最新内容。
        </p>

        <div className="blog-form-group">
          <label className="blog-form-label">
            远程数据 URL
            {isUsingDefault && (
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--blog-caramel-500)', fontWeight: 'normal' }}>
                （默认数据源）
              </span>
            )}
          </label>
          <input
            className="blog-form-input"
            type="text"
            value={remoteUrlInput}
            onChange={(e) => setRemoteUrlInput(e.target.value)}
            style={isUsingDefault ? { color: 'var(--blog-text-secondary)' } : {}}
            placeholder="https://gist.githubusercontent.com/xxx/raw/blog-data.json"
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="blog-btn blog-btn-primary" onClick={onSave}>
              保存设置
            </button>
            <button
              className="blog-btn blog-btn-secondary"
              onClick={onSync}
              disabled={syncing || !isConfigured}
            >
              {syncing ? '同步中...' : '🔄 立即同步'}
            </button>
            <button
              className="blog-btn blog-btn-ghost"
              onClick={onRestoreDefault}
              disabled={isUsingDefault}
              title="恢复为默认数据源"
            >
              ↩️ 恢复默认
            </button>
          </div>
          {isUsingDefault && (
            <p style={{ fontSize: 12, color: 'var(--blog-text-tertiary)', marginTop: 8, marginBottom: 0 }}>
              当前使用内置默认数据源，你也可以填入自己的 Gist 链接后点击「保存设置」。
            </p>
          )}
        </div>

        {remoteStatus && (
          <div className={`blog-remote-status blog-remote-status-${remoteStatus.type}`}>
            {remoteStatus.type === 'success' ? '✅ ' : '⚠️ '}
            {remoteStatus.message}
          </div>
        )}
      </div>

      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogInfoIcon size={18} />
          当前状态
        </div>
        <div className="blog-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="blog-stat-item">
            <div className="blog-stat-value" style={{ fontSize: 20 }}>
              {isConfigured ? '✅' : '❌'}
            </div>
            <div className="blog-stat-label">数据源状态</div>
          </div>
          <div className="blog-stat-item">
            <div className="blog-stat-value" style={{ fontSize: 20 }}>
              {remoteArticleCount}
            </div>
            <div className="blog-stat-label">远程文章数</div>
          </div>
          <div className="blog-stat-item">
            <div className="blog-stat-value" style={{ fontSize: 14, wordBreak: 'break-all' }}>
              {lastSync?.syncedAt ? blogFormatDateShort(lastSync.syncedAt) : '—'}
            </div>
            <div className="blog-stat-label">上次同步</div>
          </div>
        </div>
      </div>

      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogDownloadIcon size={18} />
          导出远程格式
        </div>
        <p style={{ fontSize: 13, color: 'var(--blog-text-secondary)', lineHeight: 1.8, margin: '0 0 16px 0' }}>
          把当前本地所有文章、图片和附件导出为一个 JSON 文件。这个文件格式与远程数据源格式完全一致，
          可直接上传到 GitHub Gist 等平台作为远程数据源。
        </p>
        <button className="blog-btn blog-btn-primary" onClick={onExport}>
          📤 导出数据（远程格式）
        </button>
      </div>

      {/* GitHub 自动同步到 Gist */}
      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogGithubIcon size={18} />
          GitHub 自动同步
        </div>
        <p style={{ fontSize: 13, color: 'var(--blog-text-secondary)', lineHeight: 1.8, margin: '0 0 16px 0' }}>
          配置 GitHub Personal Access Token 后，可以直接把本地数据推送到 Gist，无需手动导出复制粘贴。
          <br />
          Token 需要在 <code style={{
            padding: '2px 6px',
            background: 'var(--blog-cream-100)',
            borderRadius: '4px',
            fontSize: 12,
          }}>github.com → Settings → Developer settings → Personal access tokens</code> 中创建，
          勾选 <strong>gist</strong> 权限即可。Token 只保存在你本地的浏览器中，不会上传到任何服务器。
        </p>

        <div className="blog-form-group">
          <label className="blog-form-label">
            GitHub Personal Access Token
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 'normal', color: hasToken ? 'var(--blog-forest-600)' : 'var(--blog-text-tertiary)' }}>
              {hasToken ? '✅ 已配置' : '❌ 未配置'}
            </span>
          </label>
          <input
            className="blog-form-input"
            type="password"
            value={githubTokenInput}
            onChange={(e) => setGithubTokenInput(e.target.value)}
            placeholder={hasToken ? '••••••••（已有 Token，留空则不修改）' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
            autoComplete="off"
          />
          {!hasToken && githubTokenInput && (
            <p style={{ fontSize: 12, color: 'var(--blog-caramel-600)', marginTop: 8, marginBottom: 0 }}>
              ⚠  Token 已预填，点击「保存 Token」即可启用。建议定期在 GitHub 设置中轮换 Token。
            </p>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="blog-btn blog-btn-primary"
              onClick={onSaveToken}
              disabled={!githubTokenInput.trim() && hasToken}
            >
              💾 {hasToken ? '更新 Token' : '保存 Token'}
            </button>
            {hasToken && (
              <button className="blog-btn blog-btn-ghost" onClick={onClearToken}>
                🗑 清除 Token
              </button>
            )}
          </div>
        </div>

        {/* Gist 信息 */}
        {hasToken && (
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            background: 'var(--blog-cream-100)',
            borderRadius: 'var(--blog-radius-md)',
            fontSize: 13,
            lineHeight: 1.8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--blog-text-secondary)' }}>Gist ID：</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--blog-text-primary)' }}>
                {gistInfo?.gistId || '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--blog-text-secondary)' }}>文件名：</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--blog-text-primary)' }}>
                {gistInfo?.filename || '—'}
              </span>
            </div>
            {gistInfo?.gistPageUrl && (
              <div style={{ marginTop: 4 }}>
                <a
                  href={gistInfo.gistPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--blog-caramel-600)', textDecoration: 'none', fontSize: 12 }}
                >
                  🔗 在 GitHub 查看 Gist
                </a>
              </div>
            )}
            {!gistInfo?.isValid && (
              <div style={{
                marginTop: 8,
                color: 'var(--blog-rose-500)',
                fontSize: 12,
              }}>
                ⚠  无法从当前数据源 URL 识别 Gist，请确认 URL 格式为 gist.githubusercontent.com 的 raw 链接
              </div>
            )}
          </div>
        )}

        {/* 同步状态和操作 */}
        {hasToken && (
          <div style={{ marginTop: 16 }}>
            <div className="blog-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 12 }}>
              <div className="blog-stat-item">
                <div className="blog-stat-value" style={{ fontSize: 18 }}>
                  {unsyncedCount > 0 ? `⚠ ${unsyncedCount}` : '✅'}
                </div>
                <div className="blog-stat-label">未同步文章</div>
              </div>
              <div className="blog-stat-item">
                <div className="blog-stat-value" style={{ fontSize: 13, wordBreak: 'break-all' }}>
                  {lastPushToGist?.pushedAt ? blogFormatDateShort(lastPushToGist.pushedAt) : '—'}
                </div>
                <div className="blog-stat-label">上次推送</div>
              </div>
              <div className="blog-stat-item">
                <div className="blog-stat-value" style={{ fontSize: 18 }}>
                  {autoSyncEnabled ? '🟢' : '⚪'}
                </div>
                <div className="blog-stat-label">自动同步</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="blog-btn blog-btn-primary"
                onClick={onPushToGist}
                disabled={pushingToGist || !gistInfo?.isValid}
                style={{ flex: 1, minWidth: 160 }}
              >
                {pushingToGist ? '🔄 推送中...' : '🚀 同步到 Gist'}
              </button>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 12px',
                background: 'var(--blog-bg-soft)',
                border: '1px solid var(--blog-border)',
                borderRadius: 'var(--blog-radius-md)',
                fontSize: 13,
                color: 'var(--blog-text-secondary)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => onToggleAutoSync(e.target.checked)}
                  disabled={!gistInfo?.isValid}
                />
                保存后自动同步
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogLightbulbIcon size={18} />
          使用说明
        </div>
        <ol style={{ fontSize: 13, color: 'var(--blog-text-secondary)', lineHeight: 2, margin: 0, paddingLeft: 20 }}>
          <li>在 GitHub 创建一个 Gist，新建一个 <code style={{ padding: '2px 4px', background: 'var(--blog-cream-100)', borderRadius: 3, fontSize: 12 }}>.json</code> 文件</li>
          <li>创建 GitHub Personal Access Token（勾选 gist 权限）</li>
          <li>把 Gist 的 raw 链接粘贴到上方「远程数据 URL」并保存</li>
          <li>在下方「GitHub 自动同步」中填入 Token 并保存</li>
          <li>点击「🚀 同步到 Gist」或开启自动同步，数据会自动推送到 Gist</li>
          <li>访客访问首页时，就会自动从 Gist 加载最新文章</li>
        </ol>
      </div>
    </div>
  );
}

const BlogGlobeIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const BlogLightbulbIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
);

// 数据管理面板组件
function BlogDataPanel({ storageInfo, onExport, onImport, onClear, onResetToDefault, onRefresh, onExportWebsite, exportingWebsite, exportedWebsiteInfo }) {
  if (!storageInfo) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--blog-text-tertiary)' }}>
        加载中...
      </div>
    );
  }

  const usagePercent = Math.min(100, Math.round(storageInfo.mb / storageInfo.estimatedLimit * 100));
  const usageColor = usagePercent > 80 ? 'var(--blog-rose-500)'
    : usagePercent > 60 ? 'var(--blog-caramel-500)'
    : 'var(--blog-forest-500)';

  return (
    <div className="blog-data-panel">
      {/* 存储概览 */}
      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogDatabaseIcon size={18} />
          存储概览
          <button
            className="blog-btn blog-btn-secondary blog-btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={onRefresh}
          >
            刷新
          </button>
        </div>
        <div className="blog-stats-grid">
          <div className="blog-stat-item">
            <div className="blog-stat-value">{storageInfo.articlesCount}</div>
            <div className="blog-stat-label">篇文章</div>
          </div>
          <div className="blog-stat-item">
            <div className="blog-stat-value">{storageInfo.filesCount}</div>
            <div className="blog-stat-label">个文件</div>
          </div>
          <div className="blog-stat-item">
            <div className="blog-stat-value">{storageInfo.mb.toFixed(2)} MB</div>
            <div className="blog-stat-label">已用空间</div>
          </div>
          <div className="blog-stat-item">
            <div className="blog-stat-value">
              {storageInfo.hasRealEstimate ? storageInfo.estimatedLimit + ' MB' : storageInfo.estimatedLimit + ' MB+'}
            </div>
            <div className="blog-stat-label">
              {storageInfo.hasRealEstimate ? '可用容量' : '预估容量'}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--blog-text-secondary)', marginBottom: 6 }}>
            <span>空间使用率</span>
            <span>{usagePercent}%</span>
          </div>
          <div style={{
            height: 12,
            background: 'var(--blog-cream-200)',
            borderRadius: 'var(--blog-radius-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: usagePercent + '%',
              height: '100%',
              background: usageColor,
              borderRadius: 'var(--blog-radius-full)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          {storageInfo.isLegacy && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--blog-caramel-600)' }}>
              ⚠️ 当前使用 localStorage 模式（容量有限），建议使用支持 IndexedDB 的现代浏览器
            </div>
          )}
        </div>
      </div>

      {/* 数据操作 */}
      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogDownloadIcon size={18} />
          数据操作
        </div>
        <div className="blog-data-actions">
          <button className="blog-data-action-btn" onClick={onExport}>
            <div className="blog-data-action-icon">📤</div>
            <div>
              <div className="blog-data-action-title">导出数据</div>
              <div className="blog-data-action-desc">导出所有文章、图片和设置为 JSON 备份文件</div>
            </div>
            <BlogChevronRightIcon size={18} style={{ marginLeft: 'auto', color: 'var(--blog-text-tertiary)' }} />
          </button>
          <button className="blog-data-action-btn" onClick={onImport}>
            <div className="blog-data-action-icon">📥</div>
            <div>
              <div className="blog-data-action-title">导入数据</div>
              <div className="blog-data-action-desc">从 JSON 备份文件恢复所有数据（覆盖现有）</div>
            </div>
            <BlogChevronRightIcon size={18} style={{ marginLeft: 'auto', color: 'var(--blog-text-tertiary)' }} />
          </button>
          <button className="blog-data-action-btn blog-data-action-btn-danger" onClick={onClear}>
            <div className="blog-data-action-icon">🗑️</div>
            <div>
              <div className="blog-data-action-title">清空所有数据</div>
              <div className="blog-data-action-desc">删除所有文章、文件，恢复默认设置</div>
            </div>
            <BlogChevronRightIcon size={18} style={{ marginLeft: 'auto', color: 'var(--blog-rose-400)' }} />
          </button>
          <button className="blog-data-action-btn" onClick={onResetToDefault} style={{ borderColor: 'var(--blog-caramel-200)' }}>
            <div className="blog-data-action-icon">🔄</div>
            <div>
              <div className="blog-data-action-title">重置为默认数据</div>
              <div className="blog-data-action-desc">清除所有数据并恢复初始默认内容（博主信息 kings小wang + 示例文章）</div>
            </div>
            <BlogChevronRightIcon size={18} style={{ marginLeft: 'auto', color: 'var(--blog-text-tertiary)' }} />
          </button>
        </div>
      </div>

      {/* 部署导出 */}
      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogPackageIcon size={18} />
          部署到 GitHub Pages
        </div>
        <div style={{ fontSize: 13, color: 'var(--blog-text-secondary)', lineHeight: 1.8, marginBottom: 14 }}>
          把完整的网站源码打包成 ZIP，下载后上传到 GitHub 仓库即可部署到 GitHub Pages。
          支持 <code style={{
            background: 'var(--blog-cream-100)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: 12,
          }}>username.github.io</code> 和普通仓库子路径。
        </div>
        <button
          className="blog-btn blog-btn-primary"
          onClick={onExportWebsite}
          disabled={exportingWebsite}
        >
          {exportingWebsite ? '📦 正在打包...' : '📦 导出网站源码 (ZIP)'}
        </button>
        {exportedWebsiteInfo && (
          <div style={{
            marginTop: 12,
            fontSize: 12,
            color: 'var(--blog-forest-600)',
          }}>
            ✅ 打包完成，共 {exportedWebsiteInfo.fileCount} 个文件，大小 {PawDB.formatFileSize(exportedWebsiteInfo.size)}
          </div>
        )}
      </div>

      {/* 说明 */}
      <div className="blog-data-card">
        <div className="blog-data-card-title">
          <BlogInfoIcon size={18} />
          关于存储
        </div>
        <div style={{ fontSize: 13, color: 'var(--blog-text-secondary)', lineHeight: 1.8 }}>
          <p>• 本博客使用浏览器内置的 <strong>IndexedDB</strong> 数据库存储所有数据，容量通常可达几百 MB 到几 GB。</p>
          <p>• 数据保存在你当前使用的浏览器中，不同浏览器/设备之间不共享。</p>
          <p>• 清除浏览器数据会删除所有博客内容，建议定期使用「导出数据」功能备份。</p>
          <p>• 单文件上传上限为 50MB，图片上传后会自动压缩（最大宽度 1200px）。</p>
        </div>
      </div>
    </div>
  );
}

const BlogDatabaseIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const BlogDownloadIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const BlogInfoIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const BlogPackageIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4L7.55 4.24"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

window.BlogAdminPage = BlogAdminPage;
