// 个人信息管理页面
function ProfilePage({ admin, onAdminUpdate }) {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [profileForm, setProfileForm] = React.useState({
    nickname: admin?.nickname || '',
    email: admin?.email || '',
    bio: admin?.bio || '',
    location: admin?.location || '',
    blog: admin?.blog || '',
    socialLinks: admin?.socialLinks || [],
  });
  const [presets, setPresets] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  // 修改密码
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = React.useState(false);

  React.useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    const data = await AdminAuthAPI.getPresetAvatars();
    setPresets(data.presets);
  };

  const updateProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await AdminAuthAPI.uploadAvatar(file);
      onAdminUpdate(result.admin);
      showToast('头像更新成功', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handlePresetAvatar = async (presetId) => {
    try {
      const result = await AdminAuthAPI.setPresetAvatar(presetId);
      onAdminUpdate(result.admin);
      showToast('头像已更换', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const result = await AdminAuthAPI.updateProfile(profileForm);
      onAdminUpdate(result.admin);
      showToast('资料更新成功', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('两次输入的新密码不一致', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('新密码至少需要 6 个字符', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      await AdminAuthAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showToast('密码修改成功', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const addSocialLink = () => {
    setProfileForm((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { platform: 'GitHub', url: '' }],
    }));
  };

  const updateSocialLink = (index, key, value) => {
    setProfileForm((prev) => {
      const links = [...(prev.socialLinks || [])];
      links[index] = { ...links[index], [key]: value };
      return { ...prev, socialLinks: links };
    });
  };

  const removeSocialLink = (index) => {
    setProfileForm((prev) => {
      const links = [...(prev.socialLinks || [])];
      links.splice(index, 1);
      return { ...prev, socialLinks: links };
    });
  };

  const getAvatarContent = () => {
    if (!admin) return '🦊';
    if (admin.avatar && admin.avatar.startsWith('preset:')) {
      const presetId = admin.avatar.replace('preset:', '');
      const preset = presets.find((p) => p.id === presetId);
      return preset ? preset.emoji : '🦊';
    }
    if (admin.avatar && admin.avatar.startsWith('data:')) {
      return <img src={admin.avatar} alt="avatar" />;
    }
    return '🦊';
  };

  const socialPlatforms = ['GitHub', 'Twitter', '博客', '邮箱', 'B站', '其他'];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">个人信息</h1>
        <p className="page-subtitle">管理你的个人资料和账号安全</p>
      </div>

      <div className="profile-layout">
        {/* 左侧头像区 */}
        <div className="profile-sidebar-card">
          <div className="profile-sidebar-avatar">
            {getAvatarContent()}
          </div>
          <div className="profile-sidebar-name">{admin?.nickname || '管理员'}</div>
          <div className="profile-sidebar-role">{admin?.username || 'admin'}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <button
              className="btn btn-secondary btn-sm btn-full"
              onClick={() => document.getElementById('avatar-upload-input').click()}
            >
              <UploadIcon size={14} />
              上传头像
            </button>
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
          </div>

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              内置头像
            </div>
            <div className="preset-avatars">
              {presets.map((p) => {
                const isSelected = admin?.avatar === `preset:${p.id}`;
                return (
                  <div
                    key={p.id}
                    className={`preset-avatar ${isSelected ? 'selected' : ''}`}
                    onClick={() => handlePresetAvatar(p.id)}
                    title={p.name}
                  >
                    {p.emoji}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tabs-container" style={{ paddingLeft: 20, paddingRight: 20 }}>
            <button
              className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              基本资料
            </button>
            <button
              className={`tab-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              修改密码
            </button>
          </div>

          <div style={{ padding: '8px 24px 24px' }}>
            {activeTab === 'profile' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">昵称</label>
                  <input
                    className="form-input"
                    type="text"
                    value={profileForm.nickname}
                    onChange={(e) => updateProfileField('nickname', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">邮箱</label>
                  <input
                    className="form-input"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => updateProfileField('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">所在地</label>
                  <input
                    className="form-input"
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => updateProfileField('location', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">个人博客</label>
                  <input
                    className="form-input"
                    type="text"
                    value={profileForm.blog}
                    onChange={(e) => updateProfileField('blog', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">个人简介</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={profileForm.bio}
                    onChange={(e) => updateProfileField('bio', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>社交链接</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={addSocialLink}
                    >
                      <PlusIcon size={14} />
                      添加
                    </button>
                  </div>
                  <div className="social-links-list">
                    {(profileForm.socialLinks || []).length === 0 ? (
                      <div style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: 'var(--color-text-tertiary)',
                        fontSize: 13,
                        background: 'var(--color-cream-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px dashed var(--color-caramel-200)',
                      }}>
                        还没有社交链接，点击上方添加
                      </div>
                    ) : (
                      profileForm.socialLinks.map((link, idx) => (
                        <div key={idx} className="social-link-item">
                          <select
                            className="form-select"
                            style={{ width: 120, flexShrink: 0 }}
                            value={link.platform}
                            onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                          >
                            {socialPlatforms.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <input
                            className="form-input"
                            type="text"
                            value={link.url}
                            onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                            placeholder="https://..."
                          />
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => removeSocialLink(idx)}
                            title="删除"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="full-width" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? '保存中...' : '保存修改'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div style={{ maxWidth: 400 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">当前密码</label>
                  <input
                    className="form-input"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="请输入当前密码"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">新密码</label>
                  <input
                    className="form-input"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="至少 6 个字符"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">确认新密码</label>
                  <input
                    className="form-input"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="再次输入新密码"
                  />
                </div>
                <button className="btn btn-primary" onClick={handleChangePassword} disabled={passwordSaving}>
                  {passwordSaving ? '修改中...' : '修改密码'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.ProfilePage = ProfilePage;
