// 关于我页面
function AboutPage({ profile }) {
  const skills = PawData.SKILLS;
  const timeline = PawData.TIMELINE;

  return (
    <div className="about-section">
      <div className="section-header">
        <div className="section-decoration">
          <PawIcon size={20} />
        </div>
        <h2 className="section-title">关于我</h2>
        <p className="section-subtitle">认识一下这只爱写代码的小狐狸 🦊</p>
      </div>

      <div className="about-intro">
        <div className="about-avatar-wrap">
          <div className="about-avatar">
            {getAvatarDisplay(profile?.avatar)}
          </div>
        </div>
        <div className="about-content">
          <h2>嗨，我是 {profile?.nickname || '小狐狸'}！🐾</h2>
          <p>
            {profile?.bio || '一只热爱开源的小狐狸，喜欢用毛茸茸的方式写代码。'}
          </p>
          <p>
            我是一名前端工程师，同时也是一名 furry 爱好者。我喜欢把毛茸茸的温暖感觉融入到代码和设计中，
            让每一个作品都像是被柔软的毛发包裹着一样舒适。
          </p>
          <p>
            平时我喜欢折腾各种开源项目，探索新的技术，也会画一些可爱的小插画。
            如果你喜欢我的作品，欢迎来逛逛我的 GitHub 或者通过邮箱联系我～
          </p>
        </div>
      </div>

      {/* 技能栈 */}
      <div className="skills-section">
        <div className="section-header" style={{ marginBottom: 28 }}>
          <div className="section-decoration">
            <PawIcon size={18} />
          </div>
          <h3 className="section-title" style={{ fontSize: 24 }}>技能 & 技术栈</h3>
          <p className="section-subtitle">这些是我平时经常用到的工具和技术</p>
        </div>
        <div className="skills-cloud">
          {skills.map((skill, idx) => (
            <span key={idx} className="skill-tag">{skill}</span>
          ))}
        </div>
      </div>

      {/* 时间线 */}
      <div className="timeline-section">
        <div className="section-header" style={{ marginBottom: 32 }}>
          <div className="section-decoration">
            <PawIcon size={18} />
          </div>
          <h3 className="section-title" style={{ fontSize: 24 }}>成长历程</h3>
          <p className="section-subtitle">一路踩坑，一路成长的小狐狸足迹 🐾</p>
        </div>
        <div className="timeline">
          {timeline.map((item, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-date">{item.date}</div>
              <div className="timeline-title">{item.title}</div>
              <div className="timeline-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 联系方式 */}
      <div className="contact-section">
        <div className="contact-title">想聊点什么？💬</div>
        <p className="contact-desc">
          欢迎通过以下方式联系我，合作、交流、撸狐狸都可以～
        </p>
        <div className="contact-links">
          {profile?.socialLinks?.map((link, idx) => (
            <a
              key={idx}
              className="contact-link"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{getSocialIcon(link.platform)}</span>
              {link.platform}
            </a>
          ))}
          {profile?.email && (
            <a className="contact-link" href={`mailto:${profile.email}`}>
              <span>📧</span>
              {profile.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

window.AboutPage = AboutPage;
