// 个人主页

function ProfilePage({
  username, onViewDetail, onViewProfile,
  user, starredProjects, onToggleStar, onOpenLogin,
}) {
  const [profileData, setProfileData] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('projects');
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [followers, setFollowers] = React.useState([]);
  const [following, setFollowing] = React.useState([]);

  const loadProfile = () => {
    setLoading(true);
    Promise.all([
      UsersAPI.getProfile(username),
      UsersAPI.getProjects(username),
    ]).then(([profileData, projectsData]) => {
      setProfileData(profileData);
      setProjects(projectsData.projects || []);
      setIsFollowing(profileData.isFollowing);
      setFollowerCount(profileData.stats.followerCount);
      setLoading(false);
    }).catch(e => {
      console.error('加载用户主页失败:', e);
      setLoading(false);
    });
  };

  const loadFollowLists = () => {
    Promise.all([
      UsersAPI.getFollowers(username),
      UsersAPI.getFollowing(username),
    ]).then(([fData, fgData]) => {
      setFollowers(fData.users || []);
      setFollowing(fgData.users || []);
    }).catch(() => {});
  };

  React.useEffect(() => {
    loadProfile();
    loadFollowLists();
  }, [username]);

  const handleFollow = async () => {
    if (!user) {
      onOpenLogin();
      return;
    }
    try {
      const data = await UsersAPI.toggleFollow(username);
      setIsFollowing(data.following);
      setFollowerCount(data.followerCount);
      showToast(data.following ? '关注成功 ✨' : '已取消关注', 'info');
      // 刷新粉丝列表
      loadFollowLists();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        <PawIcon size={28} color="var(--color-caramel-400)" />
        <div style={{ marginTop: 10, fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">😿</div>
        <div className="empty-state-text">用户不存在</div>
      </div>
    );
  }

  const targetUser = profileData.user;
  const stats = profileData.stats;
  const isOwn = profileData.isOwn;

  const tabs = [
    { id: 'projects', label: '项目', icon: <BookIcon size={16} color="currentColor" />, count: stats.projectCount },
    { id: 'starred', label: '星标', icon: <StarIcon size={16} color="currentColor" />, count: stats.starCount },
    { id: 'followers', label: '粉丝', icon: <UsersIcon size={16} color="currentColor" />, count: followerCount },
    { id: 'following', label: '关注', icon: <HeartIcon size={16} color="currentColor" />, count: stats.followingCount },
  ];

  return (
    <div>
      {/* Hero 区域 */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-caramel-100) 0%, var(--color-cream-100) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 36px',
        marginBottom: 24,
        border: '2px solid var(--color-caramel-200)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰爪印 */}
        <div style={{
          position: 'absolute', top: -30, right: 30,
          fontSize: 120, opacity: 0.08,
          transform: 'rotate(15deg)',
        }}>🐾</div>
        <div style={{
          position: 'absolute', bottom: -20, left: '40%',
          fontSize: 80, opacity: 0.06,
          transform: 'rotate(-10deg)',
        }}>🐾</div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative' }}>
          {/* 大头像 */}
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '5px solid var(--color-cream-100)',
            boxShadow: 'var(--shadow-md)',
            background: 'var(--color-caramel-200)',
            position: 'relative',
            top: -10,
          }}>
            {targetUser.avatar ? (
              <img src={targetUser.avatar} alt={targetUser.username}
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, fontWeight: 600, color: 'var(--color-caramel-600)',
                fontFamily: 'var(--font-display)',
              }}>{targetUser.username?.[0]?.toUpperCase()}</div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26, fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}>{targetUser.username}</h1>
              {isOwn && (
                <span style={{
                  padding: '3px 10px', borderRadius: 999,
                  background: 'var(--color-caramel-200)',
                  color: 'var(--color-caramel-700)',
                  fontSize: 11, fontWeight: 500,
                }}>这是你</span>
              )}
            </div>
            <div style={{
              fontSize: 14, color: 'var(--color-text-secondary)',
              marginBottom: 12,
            }}>
              @{targetUser.username}
            </div>

            {targetUser.bio && (
              <p style={{
                fontSize: 14, color: 'var(--color-text-primary)',
                lineHeight: 1.6, marginBottom: 14, maxWidth: 500,
              }}>{targetUser.bio}</p>
            )}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              {targetUser.location && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 13, color: 'var(--color-text-secondary)',
                }}>
                  <MapPinIcon size={14} color="currentColor" />
                  {targetUser.location}
                </div>
              )}
              {targetUser.blog && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 13, color: 'var(--color-caramel-600)',
                }}>
                  <LinkIcon size={14} color="currentColor" />
                  {targetUser.blog}
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, color: 'var(--color-text-secondary)',
              }}>
                <CalendarIcon size={14} color="currentColor" />
                加入于 {formatFullDate(targetUser.createdAt)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {!isOwn && user && (
                <button
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleFollow}
                >
                  <HeartIcon size={14} color="currentColor" filled={isFollowing} />
                  {isFollowing ? '已关注' : '关注'}
                </button>
              )}
              {!isOwn && !user && (
                <button className="btn btn-primary" onClick={onOpenLogin}>
                  <HeartIcon size={14} color="currentColor" />
                  关注
                </button>
              )}
            </div>
          </div>

          {/* 统计数字 */}
          <div style={{
            display: 'flex', gap: 20, flexShrink: 0,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 700,
                color: 'var(--color-caramel-700)',
              }}>{stats.projectCount}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>项目</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 700,
                color: 'var(--color-mint-gold)',
              }}>{stats.starCount}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>星标</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 700,
                color: 'var(--color-caramel-600)',
              }}>{followerCount}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>粉丝</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 700,
                color: 'var(--color-forest-500)',
              }}>{stats.followingCount}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>关注</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 内容 */}
      {activeTab === 'projects' && (
        <div>
          {projects.length === 0 ? (
            <div style={{
              padding: '60px 0', textAlign: 'center',
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-bg-soft)',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--color-border)',
            }}>
              <BookIcon size={36} color="var(--color-caramel-300)" />
              <div style={{ marginTop: 12, fontSize: 14 }}>
                {isOwn ? '还没有发布项目，去发布一个吧！' : 'TA 还没有发布项目'}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {projects.map(p => (
                <RepoCard
                  key={p.id}
                  project={p}
                  onViewDetail={onViewDetail}
                  onViewProfile={onViewProfile}
                  starred={starredProjects.includes(p.id)}
                  onToggleStar={onToggleStar}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'starred' && (
        <div style={{
          padding: '40px 0', textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          background: 'var(--color-bg-soft)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--color-border)',
        }}>
          <StarIcon size={36} color="var(--color-caramel-300)" />
          <div style={{ marginTop: 12, fontSize: 14 }}>
            共收到 {stats.starCount} 个星标收藏 ✨
          </div>
        </div>
      )}

      {activeTab === 'followers' && (
        <UserList
          users={followers}
          onViewProfile={onViewProfile}
          emptyText="还没有粉丝"
        />
      )}

      {activeTab === 'following' && (
        <UserList
          users={following}
          onViewProfile={onViewProfile}
          emptyText="还没有关注的人"
        />
      )}
    </div>
  );
}

// 用户列表组件
function UserList({ users, onViewProfile, emptyText }) {
  if (!users || users.length === 0) {
    return (
      <div style={{
        padding: '40px 0', textAlign: 'center',
        color: 'var(--color-text-tertiary)', fontSize: 13,
        background: 'var(--color-bg-soft)',
        borderRadius: 'var(--radius-lg)',
        border: '2px dashed var(--color-border)',
      }}>
        <UsersIcon size={32} color="var(--color-caramel-300)" />
        <div style={{ marginTop: 10 }}>{emptyText}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {users.map(u => (
        <div
          key={u.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 16,
            background: 'var(--color-bg-card)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-caramel-300)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => onViewProfile && onViewProfile(u.username)}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
            background: 'var(--color-caramel-200)', flexShrink: 0,
          }}>
            {u.avatar ? (
              <img src={u.avatar} alt={u.username}
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 600, color: 'var(--color-caramel-600)',
                fontFamily: 'var(--font-display)',
              }}>{u.username?.[0]?.toUpperCase()}</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600, fontSize: 14,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-display)',
            }}>{u.username}</div>
            <div style={{
              fontSize: 12, color: 'var(--color-text-tertiary)',
              marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{u.bio || '这只小兽还没有填写简介'}</div>
          </div>
          <ChevronLeftIcon size={16} color="var(--color-caramel-400)" style={{ transform: 'rotate(180deg)' }} />
        </div>
      ))}
    </div>
  );
}

// 暴露到全局
Object.assign(window, { ProfilePage, UserList });
