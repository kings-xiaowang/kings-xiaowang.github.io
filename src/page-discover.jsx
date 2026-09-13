// 项目发现页（完整列表 + 筛选）
function DiscoverPage({ projects, onNavigate, initialQuery }) {
  const [searchQuery, setSearchQuery] = React.useState(initialQuery || '');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterLanguage, setFilterLanguage] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('newest');
  const [filtered, setFiltered] = React.useState(projects);

  const categories = React.useMemo(() => {
    return [...new Set(projects.map((p) => p.category).filter(Boolean))];
  }, [projects]);

  const languages = React.useMemo(() => {
    return [...new Set(projects.map((p) => p.language).filter(Boolean))];
  }, [projects]);

  React.useEffect(() => {
    let result = [...projects];

    // 搜索
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.topics && p.topics.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // 分类筛选
    if (filterCategory !== 'all') {
      result = result.filter((p) => p.category === filterCategory);
    }

    // 语言筛选
    if (filterLanguage !== 'all') {
      result = result.filter((p) => p.language === filterLanguage);
    }

    // 排序
    if (sortBy === 'stars') {
      result.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // 最新
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    setFiltered(result);
  }, [searchQuery, filterCategory, filterLanguage, sortBy, projects]);

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-decoration">
          <PawIcon size={20} />
        </div>
        <h2 className="section-title">发现项目</h2>
        <p className="section-subtitle">探索我的所有开源作品和创意项目 🐾</p>
      </div>

      {/* 筛选栏 */}
      <div className="discover-filters">
        <div className="discover-search">
          <span className="discover-search-icon">
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            placeholder="搜索项目名称、描述或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="discover-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="discover-select"
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
        >
          <option value="all">全部语言</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          className="discover-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">最新发布</option>
          <option value="stars">最热门</option>
          <option value="name">名称排序</option>
        </select>
      </div>

      {/* 项目网格 */}
      {filtered.length === 0 ? (
        <EmptyState
          title="没有找到匹配的项目"
          desc="试试换个关键词或筛选条件吧～"
          emoji="🔍"
        />
      ) : (
        <div className="projects-grid">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onNavigate('detail', { id: project.id })}
            />
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-text-tertiary)' }}>
        共 {filtered.length} 个项目
      </div>
    </section>
  );
}

window.DiscoverPage = DiscoverPage;
