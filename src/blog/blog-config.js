// PawBlog 站点硬编码配置
// 博客名称、博主信息在这里统一维护，不被远程数据覆盖
// 所有页面渲染时都应从这里读取，而不是从远程数据或本地 DB 读取

const SITE_CONFIG = {
  // 博客名称
  siteName: 'kings小wang的个人博客',
  siteSubtitle: '记录生活与代码的毛茸茸角落',

  // 博主信息
  author: {
    nickname: 'kings小wang',
    avatar: 'preset:fox',
    bio: '热爱开源和写作，用毛茸茸的方式记录技术与生活。',
    location: '中国',
    email: 'hi@kingswang.blog',
    blog: 'https://kings-xiaowang.github.io/kingsxiaowang.github.io/',
    github: 'https://github.com/kings-xiaowang',
  },

  // 默认技能标签（关于页展示）
  defaultSkills: ['前端开发', 'React', 'Vue', 'CSS', 'UI设计', 'furry文化', '写作'],
};

// 兼容函数：返回和 getRemoteBlogInfo / getAdminPublic 一致的形状
function getSiteConfig() {
  return SITE_CONFIG;
}

function getSiteBlogInfo() {
  return {
    title: SITE_CONFIG.siteName,
    subtitle: SITE_CONFIG.siteSubtitle,
    author: SITE_CONFIG.author.nickname,
    avatar: SITE_CONFIG.author.avatar,
    bio: SITE_CONFIG.author.bio,
    location: SITE_CONFIG.author.location,
    email: SITE_CONFIG.author.email,
    socialLinks: [
      { name: 'GitHub', url: SITE_CONFIG.author.github },
      { name: '博客', url: SITE_CONFIG.author.blog },
      { name: '邮箱', url: 'mailto:' + SITE_CONFIG.author.email },
    ],
  };
}

function getSiteAuthorPublic() {
  return {
    nickname: SITE_CONFIG.author.nickname,
    avatar: SITE_CONFIG.author.avatar,
    bio: SITE_CONFIG.author.bio,
    location: SITE_CONFIG.author.location,
    email: SITE_CONFIG.author.email,
    blog: SITE_CONFIG.author.blog.replace(/^https?:\/\//, ''),
    github: SITE_CONFIG.author.github,
    skills: SITE_CONFIG.defaultSkills,
    siteCreatedAt: Date.now() - 86400000 * 365,
  };
}

window.SITE_CONFIG = SITE_CONFIG;
window.getSiteBlogInfo = getSiteBlogInfo;
window.getSiteAuthorPublic = getSiteAuthorPublic;
