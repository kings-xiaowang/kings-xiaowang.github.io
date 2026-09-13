// PawDiscover 数据层 - 从 pawadmin localStorage 读取，无则用默认数据
(function () {
  const PAWADMIN_PROJECTS_KEY = 'pawadmin_projects';
  const PAWADMIN_ADMIN_KEY = 'pawadmin_admin';

  function safeGet(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[PawDiscover] 读取 ' + key + ' 失败:', e.message);
      return defaultValue;
    }
  }

  // 默认示例数据
  const DEFAULT_PROFILE = {
    username: 'foxiepaws',
    nickname: '狐小爪',
    avatar: 'preset:fox',
    bio: '一只热爱开源的小狐狸 🦊 喜欢用毛茸茸的方式写代码。前端工程师，业余时间做一些 furry 相关的小工具。',
    location: '森林小屋',
    blog: 'foxiepaws.dev',
    email: 'hi@foxiepaws.dev',
    socialLinks: [
      { platform: 'GitHub', url: 'https://github.com/foxiepaws' },
      { platform: 'Twitter', url: 'https://twitter.com/foxiepaws' },
      { platform: '博客', url: 'https://blog.foxiepaws.dev' },
    ],
    createdAt: Date.now() - 86400000 * 365 * 2,
  };

  const DEFAULT_PROJECTS = [
    {
      id: 'paw-ui-kit',
      name: 'Paw UI Kit',
      description: '一套毛茸茸风格的 UI 组件库，专为 furry 爱好者打造，包含 50+ 精美组件',
      category: '前端开发',
      language: 'TypeScript',
      topics: ['ui', 'component', 'furry', 'design-system'],
      linkUrl: 'https://github.com/foxiepaws/paw-ui-kit',
      readme: '# Paw UI Kit\n\n一套毛茸茸风格的 UI 组件库。\n\n## 特性\n- 🦊 可爱的毛茸茸风格\n- 🎨 丰富的主题色\n- 📦 开箱即用\n- 🔧 完全可定制\n\n## 快速开始\n\n```bash\nnpm install paw-ui-kit\n```\n\n## 组件列表\n- Button 按钮\n- Card 卡片\n- Input 输入框\n- Modal 弹窗\n- Tabs 标签页\n- ... 还有更多！',
      images: [
        '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuvdxkzsfg_ve_miaoda',
      ],
      files: [],
      views: 3248,
      stars: 256,
      createdAt: Date.now() - 86400000 * 180,
      updatedAt: Date.now() - 86400000 * 7,
    },
    {
      id: 'fox-tracker',
      name: 'Fox Tracker',
      description: '轻量级的个人任务追踪工具，支持番茄钟、习惯养成和数据统计',
      category: '效率工具',
      language: 'JavaScript',
      topics: ['productivity', 'tracker', 'pomodoro', 'habits'],
      linkUrl: '',
      readme: '# Fox Tracker\n\n小狐狸的任务追踪工具 🦊\n\n## 功能\n- ✅ 任务管理\n- 🍅 番茄钟计时\n- 📈 习惯追踪\n- 📊 数据统计\n- 🔔 提醒通知',
      images: [
        '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuvl3pwccg_ve_miaoda',
      ],
      files: [],
      views: 1856,
      stars: 128,
      createdAt: Date.now() - 86400000 * 120,
      updatedAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'furry-avatar-generator',
      name: 'Furry Avatar Generator',
      description: '在线生成个性化 furry 头像，支持数百种组合，导出高清 PNG',
      category: '创意设计',
      language: 'Vue',
      topics: ['avatar', 'generator', 'art', 'customization'],
      linkUrl: 'https://avatar.foxiepaws.dev',
      readme: '# Furry Avatar Generator\n\n生成属于你的 furry 头像！🐾\n\n支持上百种自定义选项，轻松创建独一无二的兽人形象。\n\n## 特色\n- 🎨 数百种组合\n- 🖼️ 高清导出\n- ⚡ 实时预览\n- 💾 保存方案',
      images: [
        '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuvio5heeg_ve_miaoda',
      ],
      files: [],
      views: 5234,
      stars: 412,
      createdAt: Date.now() - 86400000 * 90,
      updatedAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'paw-blog-engine',
      name: 'Paw Blog Engine',
      description: '专为 furry 创作者设计的静态博客引擎，Markdown 驱动，主题可定制',
      category: '前端开发',
      language: 'TypeScript',
      topics: ['blog', 'ssg', 'markdown', 'static-site'],
      linkUrl: 'https://github.com/foxiepaws/paw-blog',
      readme: '# Paw Blog Engine\n\n毛茸茸的静态博客引擎 🐾\n\n专为 furry 创作者设计，让你的博客也毛茸茸起来。',
      images: [],
      files: [],
      views: 1240,
      stars: 89,
      createdAt: Date.now() - 86400000 * 60,
      updatedAt: Date.now() - 86400000 * 14,
    },
    {
      id: 'fluffy-chat',
      name: 'Fluffy Chat',
      description: '开源的 furry 社区聊天工具，支持表情、贴纸和多人语音',
      category: '后端开发',
      language: 'Go',
      topics: ['chat', 'real-time', 'community', 'voip'],
      linkUrl: '',
      readme: '# Fluffy Chat\n\n毛茸茸的实时聊天工具 💬\n\n专为 furry 社区打造的开源聊天平台。',
      images: [],
      files: [],
      views: 2100,
      stars: 178,
      createdAt: Date.now() - 86400000 * 45,
      updatedAt: Date.now() - 86400000 * 5,
    },
  ];

  // 从 pawadmin 读取，没有则用默认
  function getProfile() {
    const adminData = safeGet(PAWADMIN_ADMIN_KEY, null);
    if (adminData && adminData.username) {
      return {
        username: adminData.username,
        nickname: adminData.nickname || adminData.username,
        avatar: adminData.avatar || 'preset:fox',
        bio: adminData.bio || '',
        location: adminData.location || '',
        blog: adminData.blog || '',
        email: adminData.email || '',
        socialLinks: adminData.socialLinks || [],
        createdAt: adminData.createdAt || Date.now(),
      };
    }
    return DEFAULT_PROFILE;
  }

  function getProjects() {
    const projects = safeGet(PAWADMIN_PROJECTS_KEY, null);
    if (projects && Array.isArray(projects) && projects.length > 0) {
      // 确保有 stars 字段
      return projects.map((p) => ({
        ...p,
        stars: p.stars || Math.floor(Math.random() * 300) + 20,
        views: p.views || Math.floor(Math.random() * 5000) + 500,
      }));
    }
    return DEFAULT_PROJECTS;
  }

  function getProjectById(id) {
    return getProjects().find((p) => p.id === id) || null;
  }

  function getCategories() {
    const projects = getProjects();
    return [...new Set(projects.map((p) => p.category).filter(Boolean))];
  }

  function getLanguages() {
    const projects = getProjects();
    return [...new Set(projects.map((p) => p.language).filter(Boolean))];
  }

  function getStats() {
    const projects = getProjects();
    const totalStars = projects.reduce((s, p) => s + (p.stars || 0), 0);
    const categories = new Set(projects.map((p) => p.category).filter(Boolean));
    return {
      projectCount: projects.length,
      categoryCount: categories.size,
      totalStars,
    };
  }

  function searchProjects(query, filters = {}) {
    let projects = getProjects();
    if (query && query.trim()) {
      const q = query.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.topics && p.topics.some((t) => t.toLowerCase().includes(q)))
      );
    }
    if (filters.category && filters.category !== 'all') {
      projects = projects.filter((p) => p.category === filters.category);
    }
    if (filters.language && filters.language !== 'all') {
      projects = projects.filter((p) => p.language === filters.language);
    }
    if (filters.sort === 'stars') {
      projects.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    } else if (filters.sort === 'name') {
      projects.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // 默认最新
      projects.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return projects;
  }

  // 技能/技术栈
  const SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', 'Go',
    'HTML/CSS', 'Tailwind CSS', 'Figma', 'UI/UX 设计',
    'Python', 'PostgreSQL', 'Docker', 'CI/CD',
  ];

  // 时间线
  const TIMELINE = [
    {
      date: '2024 年',
      title: '创建 Paw UI Kit',
      desc: '发布了一套毛茸茸风格的 UI 组件库，在 furry 社区广受好评',
    },
    {
      date: '2023 年',
      title: '开始独立开发',
      desc: '专注于 furry 主题的开源工具和创意项目',
    },
    {
      date: '2022 年',
      title: '加入开源社区',
      desc: '开始活跃在 GitHub，为多个开源项目贡献代码',
    },
    {
      date: '2020 年',
      title: '接触编程',
      desc: '从前端开发入门，逐渐爱上了用代码创造的感觉',
    },
  ];

  window.PawData = {
    getProfile,
    getProjects,
    getProjectById,
    getCategories,
    getLanguages,
    getStats,
    searchProjects,
    SKILLS,
    TIMELINE,
    DEFAULT_PROFILE,
    DEFAULT_PROJECTS,
  };
})();
