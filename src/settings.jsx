// 账号设置页

function SettingsPage({ user, onUpdateUser, onBack }) {
  const [activeSection, setActiveSection] = React.useState('profile');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState({ type: '', text: '' });

  // 资料表单
  const [username, setUsername] = React.useState(user?.username || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [bio, setBio] = React.useState(user?.bio || '');
  const [location, setLocation] = React.useState(user?.location || '');
  const [blog, setBlog] = React.useState(user?.blog || '');

  // 密码表单
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // 头像相关
  const [presetAvatars, setPresetAvatars] = React.useState([]);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState(null);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    // 加载预设头像列表
    fetch('/api/user/avatar/presets', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setPresetAvatars(data.avatars || []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setBlog(user.blog || '');
    }
  }, [user]);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showMsg('error', '图片大小不能超过 2MB');
      return;
    }
    if (!/^image\/(png|jpeg|jpg|gif|webp)$/.test(file.type)) {
      showMsg('error', '仅支持 PNG、JPG、GIF、WebP 格式');
      return;
    }
    // 预览
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    // 直接上传
    uploadAvatarFile(file);
  };

  const uploadAvatarFile = async (file) => {
    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传失败');
      onUpdateUser(data.user);
      showMsg('success', '头像上传成功 🐾');
      setAvatarPreview(null);
    } catch (err) {
      showMsg('error', err.message);
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = async (presetId) => {
    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '设置失败');
      onUpdateUser(data.user);
      showMsg('success', '头像已更换 ✨');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const currentAvatar = avatarPreview || user?.avatar || '';

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await AuthAPI.updateProfile({ username, email, bio, location, blog });
      onUpdateUser(data.user);
      showMsg('success', '个人资料已更新 🐾');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMsg('error', '两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      showMsg('error', '新密码至少 6 位');
      return;
    }
    setSaving(true);
    try {
      await AuthAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMsg('success', '密码已更新 ✨');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: '个人资料', icon: <PawIcon size={16} color="currentColor" /> },
    { id: 'password', label: '修改密码', icon: <LockIcon size={16} color="currentColor" /> },
    { id: 'danger', label: '危险操作', icon: <AlertIcon size={16} color="currentColor" /> },
  ];

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon size={14} color="currentColor" />
        返回
      </button>

      <div className="repo-header">
        <div className="repo-header-title">
          <SettingsIcon size={24} color="var(--color-caramel-600)" />
          账号设置
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* 侧边导航 */}
        <div className="sidebar-card" style={{ padding: 8 }}>
          {sections.map((s) => (
            <div
              key={s.id}
              className={`sidebar-menu-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
              style={{ padding: '10px 12px' }}
            >
              <span className="sidebar-menu-item-icon">{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>

        {/* 主内容 */}
        <div>
          {message.text && (
            <div style={{
              padding: '12px 16px',
              marginBottom: 20,
              borderRadius: 'var(--radius-lg)',
              fontSize: 14,
              background: message.type === 'success' ? 'var(--color-forest-100)' : '#fdecea',
              color: message.type === 'success' ? 'var(--color-forest-600)' : '#d9534f',
              border: `2px solid ${message.type === 'success' ? '#b8dabc' : '#f5c2c0'}`,
            }}>
              {message.text}
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="sidebar-card" style={{ padding: 28 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 6,
              }}>个人资料</h3>
              <p style={{
                fontSize: 13, color: 'var(--color-text-tertiary)',
                marginBottom: 24,
              }}>这些信息会展示在你的个人主页上</p>

              {/* 头像区域 */}
              <div style={{
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
                padding: '20px',
                background: 'var(--color-caramel-50)',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--color-caramel-100)',
                marginBottom: 24,
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 88, height: 88,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid var(--color-cream-100)',
                    boxShadow: 'var(--shadow-md)',
                    background: 'var(--color-caramel-200)',
                  }}>
                    {currentAvatar ? (
                      <img
                        src={currentAvatar}
                        alt="头像预览"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-caramel-600)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 32, fontWeight: 600,
                      }}>
                        {user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      borderRadius: '50%',
                      background: 'rgba(60, 40, 20, 0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 11, fontWeight: 500,
                    }}>
                      上传中
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15, fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: 6,
                  }}>头像</div>
                  <p style={{
                    fontSize: 12, color: 'var(--color-text-tertiary)',
                    marginBottom: 12, lineHeight: 1.5,
                  }}>支持 PNG、JPG、GIF、WebP 格式，大小不超过 2MB</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                      <UploadIcon size={14} color="currentColor" />
                      上传图片
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleAvatarFileChange}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 内置头像选择 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <SparklesIcon size={14} color="var(--color-mint-gold)" />
                  或选择内置 Furry 头像
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 10,
                }}>
                  {presetAvatars.map((avatar) => {
                    const isSelected = user?.avatar === avatar.url;
                    return (
                      <div
                        key={avatar.id}
                        title={avatar.name}
                        onClick={() => !uploadingAvatar && handleSelectPreset(avatar.id)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          cursor: uploadingAvatar ? 'wait' : 'pointer',
                          border: isSelected ? '3px solid var(--color-caramel-600)' : '3px solid transparent',
                          boxShadow: isSelected ? '0 0 0 2px var(--color-caramel-200)' : 'none',
                          transition: 'all 0.2s',
                          background: 'var(--color-caramel-100)',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!uploadingAvatar) e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={formLabelStyle}>用户名</label>
                    <input
                      type="text" value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={formInputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={formLabelStyle}>邮箱</label>
                    <input
                      type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={formInputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={formLabelStyle}>个人简介</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="介绍一下你自己吧～"
                    style={{ ...formInputStyle, resize: 'vertical', minHeight: 80 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ flex: 1 }}>
                    <label style={formLabelStyle}>所在地</label>
                    <input
                      type="text" value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      style={formInputStyle}
                      placeholder="森林小屋 🌲"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={formLabelStyle}>个人网站</label>
                    <input
                      type="text" value={blog}
                      onChange={(e) => setBlog(e.target.value)}
                      style={formInputStyle}
                      placeholder="yourblog.com"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '保存中...' : '保存修改'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'password' && (
            <div className="sidebar-card" style={{ padding: 28 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 6,
              }}>修改密码</h3>
              <p style={{
                fontSize: 13, color: 'var(--color-text-tertiary)',
                marginBottom: 20,
              }}>定期修改密码可以保护你的账号安全</p>

              <form onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={formLabelStyle}>当前密码</label>
                  <input
                    type="password" value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={formInputStyle}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={formLabelStyle}>新密码</label>
                  <input
                    type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={formInputStyle}
                    placeholder="至少 6 位"
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={formLabelStyle}>确认新密码</label>
                  <input
                    type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={formInputStyle}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '更新中...' : '更新密码'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'danger' && (
            <div className="sidebar-card" style={{ padding: 28 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, fontWeight: 600,
                color: '#d9534f',
                marginBottom: 6,
              }}>危险操作</h3>
              <p style={{
                fontSize: 13, color: 'var(--color-text-tertiary)',
                marginBottom: 20,
              }}>以下操作不可撤销，请谨慎操作</p>

              <div style={{
                padding: 16,
                border: '2px dashed #f5c2c0',
                borderRadius: 'var(--radius-lg)',
                background: '#fef7f6',
              }}>
                <div style={{ fontWeight: 600, color: '#d9534f', marginBottom: 4 }}>
                  注销账号
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  删除你的账号和所有相关数据，此操作不可恢复。
                </div>
                <button className="btn btn-secondary" disabled style={{
                  opacity: 0.6, cursor: 'not-allowed',
                  color: '#d9534f',
                }}>
                  注销账号（开发中）
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function AlertIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function UploadIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

const formLabelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
};

const formInputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '2px solid var(--color-caramel-200)',
  borderRadius: 'var(--radius-md)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  background: 'var(--color-cream-200)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
};

Object.assign(window, {
  SettingsPage,
  LockIcon,
  AlertIcon,
});
