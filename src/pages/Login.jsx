// 登录页组件
function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await AdminAuthAPI.login(username.trim(), password);
      showToast('欢迎回来，管理员！🐾', 'success');
      onLoginSuccess(data.admin);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <PawIcon size={32} color="white" />
          </div>
          <div className="login-logo-title">PawAdmin</div>
          <div className="login-logo-subtitle">私有管理后台</div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: 13,
              border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full login-btn"
            disabled={loading}
          >
            {loading ? <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : '登 录'}
          </button>
        </form>

        <div className="login-hint">
          默认账号：admin / admin123
        </div>
      </div>
    </div>
  );
}

window.LoginPage = LoginPage;
