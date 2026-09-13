// 认证相关组件：登录弹窗、注册弹窗、用户下拉菜单

// ========== 模态框基础 ==========
function Modal({ isOpen, onClose, title, children, width = 420 }) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(60, 40, 20, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-cream-100)',
          border: '2px solid var(--color-caramel-200)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: width,
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 顶部装饰 */}
        <div style={{
          height: 8,
          background: 'linear-gradient(90deg, var(--color-caramel-400), var(--color-mauve-500))',
        }}></div>

        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--color-caramel-900)',
              margin: 0,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 'var(--radius-full)',
                background: 'transparent', border: 'none',
                color: 'var(--color-text-tertiary)',
                fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-caramel-100)';
                e.target.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--color-text-tertiary)';
              }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ========== 登录弹窗 ==========
function LoginModal({ isOpen, onClose, onSwitchToRegister, onLoginSuccess }) {
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setIdentifier('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('请输入账号和密码');
      return;
    }
    setLoading(true);
    try {
      const data = await AuthAPI.login(identifier.trim(), password);
      showToast('登录成功，欢迎回来！🐾', 'success');
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <>
        <PawIcon size={24} color="var(--color-caramel-600)" />
        登录爪印
      </>
    }>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 500,
            color: 'var(--color-text-secondary)', marginBottom: 6,
          }}>
            用户名或邮箱
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="输入用户名或邮箱"
            style={inputStyle}
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 500,
            color: 'var(--color-text-secondary)', marginBottom: 6,
          }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            style={inputStyle}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', marginBottom: 16,
            background: '#fdecea', color: '#d9534f',
            borderRadius: 'var(--radius-md)', fontSize: 13,
            border: '1px solid #f5c2c0',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...primaryBtnStyle,
            opacity: loading ? 0.6 : 1,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {loading ? '登录中...' : '登 录'}
        </button>

        <div style={{
          textAlign: 'center', marginTop: 16,
          fontSize: 13, color: 'var(--color-text-tertiary)',
        }}>
          还没有账号？
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'var(--color-caramel-700)', fontWeight: 500,
              cursor: 'pointer', marginLeft: 4,
              fontFamily: 'var(--font-body)',
            }}
          >
            立即注册
          </button>
        </div>

        <div style={{
          marginTop: 16, padding: '10px 12px',
          background: 'var(--color-caramel-50)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'var(--color-text-tertiary)',
          border: '1px dashed var(--color-caramel-200)',
        }}>
          💡 试试演示账号：<strong>foxiepaws</strong> / <strong>foxie123</strong>
        </div>
      </form>
    </Modal>
  );
}

// ========== 注册弹窗 ==========
function RegisterModal({ isOpen, onClose, onSwitchToLogin, onRegisterSuccess }) {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password) {
      setError('请填写所有字段');
      return;
    }
    if (username.length < 3 || username.length > 20) {
      setError('用户名长度需在 3-20 个字符之间');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthAPI.register(username.trim(), email.trim(), password);
      showToast('注册成功，欢迎加入爪印！🎉', 'success');
      onRegisterSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <>
        <SparklesIcon size={24} color="var(--color-mint-gold)" />
        创建新账号
      </>
    }>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3-20 个字符，支持中文、字母、数字、下划线"
            style={inputStyle}
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={inputStyle}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            style={inputStyle}
            autoComplete="new-password"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入密码"
            style={inputStyle}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', marginBottom: 16,
            background: '#fdecea', color: '#d9534f',
            borderRadius: 'var(--radius-md)', fontSize: 13,
            border: '1px solid #f5c2c0',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...primaryBtnStyle,
            opacity: loading ? 0.6 : 1,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {loading ? '注册中...' : '创建账号'}
        </button>

        <div style={{
          textAlign: 'center', marginTop: 16,
          fontSize: 13, color: 'var(--color-text-tertiary)',
        }}>
          已有账号？
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'var(--color-caramel-700)', fontWeight: 500,
              cursor: 'pointer', marginLeft: 4,
              fontFamily: 'var(--font-body)',
            }}
          >
            去登录
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ========== 用户下拉菜单 ==========
function UserDropdown({ user, onLogout, onNavigate, onOpenSettings, onMyProfile }) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  const handleProfile = () => {
    setOpen(false);
    if (onMyProfile) {
      onMyProfile();
    } else if (onNavigate) {
      onNavigate('profile');
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div
        className="navbar-avatar"
        onClick={() => setOpen(!open)}
        style={{ background: user?.avatar ? 'transparent' : undefined }}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.username} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 600, fontSize: 14,
            fontFamily: 'var(--font-display)',
          }}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0,
          background: 'var(--color-cream-100)',
          border: '2px solid var(--color-caramel-200)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: 200,
          overflow: 'hidden',
          zIndex: 100,
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-caramel-100)',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600, fontSize: 15,
              color: 'var(--color-text-primary)',
            }}>{user?.username}</div>
            <div style={{
              fontSize: 12, color: 'var(--color-text-tertiary)',
            }}>{user?.email}</div>
          </div>

          <div style={dropdownItemStyle} onClick={handleProfile}>
            <HomeIcon size={16} color="var(--color-caramel-600)" />
            我的主页
          </div>
          <div style={dropdownItemStyle} onClick={() => { setOpen(false); onOpenSettings(); }}>
            <SettingsIcon size={16} color="var(--color-caramel-600)" />
            账号设置
          </div>
          <div style={dropdownItemStyle} onClick={() => { setOpen(false); }}>
            <BookmarkIcon size={16} color="var(--color-caramel-600)" />
            我的星标
          </div>

          <div style={{ borderTop: '1px solid var(--color-caramel-100)' }}></div>

          <div
            style={{ ...dropdownItemStyle, color: '#d9534f' }}
            onClick={handleLogout}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fdecea'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOutIcon size={16} color="#d9534f" />
            退出登录
          </div>
        </div>
      )}
    </div>
  );
}

// 设置图标（内联 SVG）
function SettingsIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function LogOutIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

// 样式常量
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
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

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
};

const primaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 20px',
  borderRadius: 'var(--radius-full)',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
  border: 'none',
  background: 'var(--color-caramel-600)',
  color: 'white',
  boxShadow: '0 3px 0 var(--color-caramel-800)',
  transition: 'all 0.15s ease',
};

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(60, 40, 20, 0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
  backdropFilter: 'blur(4px)',
};

const modalContentStyle = {
  background: 'var(--color-cream-100)',
  borderRadius: 'var(--radius-xl)',
  padding: 28,
  maxWidth: 560,
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
  border: '3px solid var(--color-caramel-300)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  animation: 'modalIn 0.2s ease-out',
};

const formLabelStyle = labelStyle;
const formInputStyle = inputStyle;

// 暴露到全局
Object.assign(window, {
  Modal,
  LoginModal,
  RegisterModal,
  UserDropdown,
  SettingsIcon,
  LogOutIcon,
  inputStyle,
  labelStyle,
  primaryBtnStyle,
  dropdownItemStyle,
  modalOverlayStyle,
  modalContentStyle,
  formLabelStyle,
  formInputStyle,
});
