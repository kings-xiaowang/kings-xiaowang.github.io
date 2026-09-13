// 新建项目页面

function NewProjectPage({ user, onBack, onCreated }) {
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [language, setLanguage] = React.useState('JavaScript');
  const [topics, setTopics] = React.useState('');
  const [readme, setReadme] = React.useState('# 项目介绍\n\n写点什么吧～');
  const [icon, setIcon] = React.useState('paw');
  const [submitting, setSubmitting] = React.useState(false);

  const icons = ['paw', 'tracker', 'terminal', 'chat', 'book', 'art', 'palette', 'server'];
  const languages = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Vue', 'React', 'CSS', 'HTML', 'JSON', 'Java', 'C++', '其他'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('项目名称不能为空', 'error'); return; }
    if (!desc.trim()) { showToast('项目简介不能为空', 'error'); return; }

    setSubmitting(true);
    try {
      const data = await ProjectsAPI.create({
        name: name.trim(),
        desc: desc.trim(),
        language,
        icon,
        topics: topics.split(',').map(t => t.trim()).filter(Boolean),
        readme,
      });
      showToast('项目创建成功！🐾', 'success');
      if (onCreated) onCreated(data.project);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon size={14} color="currentColor" />
        返回
      </button>

      <div style={{
        background: 'var(--color-bg-card)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 36px',
        marginTop: 16,
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24, fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <PlusIcon size={24} color="var(--color-caramel-600)" />
            发布新项目
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: 0 }}>
            分享你的作品到毛茸茸社区，和大家一起成长 ✨
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 项目名称 + 图标 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, marginBottom: 16 }}>
            <div>
              <label style={formLabelStyle}>项目名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-awesome-project"
                style={formInputStyle}
                maxLength={50}
              />
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                最多 50 个字符
              </div>
            </div>
            <div>
              <label style={formLabelStyle}>图标</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 200 }}>
                {icons.map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    title={i}
                    style={{
                      width: 38, height: 38,
                      borderRadius: 'var(--radius-md)',
                      border: icon === i ? '2px solid var(--color-caramel-500)' : '2px solid var(--color-border)',
                      background: icon === i ? 'var(--color-caramel-100)' : 'var(--color-bg-soft)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {getProjectIcon(i, 18, icon === i ? 'var(--color-caramel-700)' : 'var(--color-text-tertiary)')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 项目简介 */}
          <div style={{ marginBottom: 16 }}>
            <label style={formLabelStyle}>项目简介 *</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="用一两句话描述你的项目..."
              style={{ ...formInputStyle, resize: 'vertical', minHeight: 70 }}
              maxLength={200}
            />
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {desc.length}/200
            </div>
          </div>

          {/* 编程语言 + 标签 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={formLabelStyle}>编程语言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ ...formInputStyle, cursor: 'pointer' }}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={formLabelStyle}>话题标签</label>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="furry, react, ui（用逗号分隔）"
                style={formInputStyle}
              />
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                最多 10 个标签
              </div>
            </div>
          </div>

          {/* README */}
          <div style={{ marginBottom: 24 }}>
            <label style={formLabelStyle}>
              README
              <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)', marginLeft: 6 }}>
                支持 Markdown 格式
              </span>
            </label>
            <textarea
              value={readme}
              onChange={(e) => setReadme(e.target.value)}
              rows={12}
              placeholder="# 项目标题\n\n介绍一下你的项目吧..."
              style={{
                ...formInputStyle,
                resize: 'vertical',
                minHeight: 200,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 12,
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* 提交按钮 */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !name.trim() || !desc.trim()}
              style={{ padding: '10px 24px', fontSize: 14 }}
            >
              <SparklesIcon size={14} color="white" />
              {submitting ? '发布中...' : '发布项目'}
            </button>
          </div>
        </form>
      </div>

      <div style={{
        marginTop: 20, padding: 16,
        background: 'var(--color-caramel-50)',
        border: '1px solid var(--color-caramel-100)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 12, color: 'var(--color-text-secondary)',
        lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 600, color: 'var(--color-caramel-700)', marginBottom: 4 }}>
          💡 小提示
        </div>
        发布项目后，你可以在项目详情页的「编辑」入口上传项目文件、修改 README 等信息。
        高质量的项目描述和 README 能让更多人发现你的作品哦 🌟
      </div>
    </div>
  );
}

// 暴露到全局
Object.assign(window, { NewProjectPage });
