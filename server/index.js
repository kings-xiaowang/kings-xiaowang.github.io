// 后端主服务 - Express 风格但用 Node.js 内置 http 模块，零依赖
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DB } from './db.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  sanitizeUser,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

// ========== 工具函数 ==========
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJSON(res, status, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) {
        reject(Object.assign(new Error('请求体过大'), { statusCode: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) { resolve({}); return; }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(Object.assign(new Error('请求体 JSON 格式错误'), { statusCode: 400 }));
      }
    });
    req.on('error', err => reject(err));
  });
}

function getCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(pair => {
    const [k, v] = pair.trim().split('=');
    if (k) cookies[k] = decodeURIComponent(v || '');
  });
  return cookies;
}

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  const existing = res.getHeader('Set-Cookie') || [];
  const list = Array.isArray(existing) ? existing : [existing];
  list.push(parts.join('; '));
  res.setHeader('Set-Cookie', list);
}

function clearCookie(res, name) {
  setCookie(res, name, '', { path: '/', maxAge: 0, expires: new Date(0) });
}

// 从 cookie 中获取当前登录用户
function getCurrentUser(req) {
  const cookies = getCookies(req);
  const sid = cookies.sid;
  if (!sid) return null;
  const session = getSession(sid);
  if (!session) return null;
  const user = findUserById(session.userId);
  return user ? sanitizeUser(user) : null;
}

// ========== 静态文件服务 ==========
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/jsx; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res, rawPath) {
  let urlPath = rawPath || decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '/index.html') urlPath = '/index.html';

  // 通用前缀剥离：找到第一个已知的静态资源目录名作为基准
  // 支持 /spark/app/app_xxx/、/app/app_xxx/ 等任意前缀
  const staticMarkers = ['/src/', '/tmp/', '/assets/', '/favicon', '/spark/', '/uploads/', '/index.html'];
  for (const marker of staticMarkers) {
    const idx = urlPath.indexOf(marker);
    if (idx > 0) {
      urlPath = urlPath.slice(idx);
      break;
    }
  }

  // 只允许已知的静态路径
  const allowedPrefixes = ['/index.html', '/src/', '/tmp/', '/assets/', '/favicon', '/spark/', '/uploads/'];
  const allowed = allowedPrefixes.some(p => urlPath.startsWith(p));
  if (!allowed) return false;

  // 安全检查：防止路径穿越
  const filePath = path.normalize(path.join(ROOT_DIR, urlPath));
  if (!filePath.startsWith(ROOT_DIR)) {
    sendError(res, 403, '禁止访问');
    return true;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince && new Date(ifModifiedSince) >= stat.mtime) {
    res.writeHead(304);
    res.end();
    return true;
  }

  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': stat.size,
    'Last-Modified': stat.mtime.toUTCString(),
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

// ========== API 路由 ==========
async function handleAPI(req, res, urlPath) {
  // 认证相关
  if (urlPath === '/api/auth/register' && req.method === 'POST') {
    return handleRegister(req, res);
  }
  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    return handleLogin(req, res);
  }
  if (urlPath === '/api/auth/logout' && req.method === 'POST') {
    return handleLogout(req, res);
  }
  if (urlPath === '/api/auth/me' && req.method === 'GET') {
    return handleMe(req, res);
  }

  // 用户资料
  if (urlPath === '/api/user/profile' && req.method === 'PUT') {
    return handleUpdateProfile(req, res);
  }
  if (urlPath === '/api/user/password' && req.method === 'PUT') {
    return handleChangePassword(req, res);
  }
  if (urlPath === '/api/user/avatar' && req.method === 'POST') {
    return handleUploadAvatar(req, res);
  }
  if (urlPath === '/api/user/avatar/presets' && req.method === 'GET') {
    return handleGetPresetAvatars(req, res);
  }

  // 星标
  if (urlPath === '/api/stars' && req.method === 'GET') {
    return handleGetStars(req, res);
  }
  if (urlPath.startsWith('/api/stars/') && req.method === 'POST') {
    const projectId = urlPath.slice('/api/stars/'.length);
    return handleToggleStar(req, res, projectId);
  }

  // 项目 CRUD
  if (urlPath === '/api/projects' && req.method === 'GET') {
    return handleListProjects(req, res);
  }
  if (urlPath === '/api/projects' && req.method === 'POST') {
    return handleCreateProject(req, res);
  }
  if (urlPath.match(/^\/api\/projects\/\d+$/) && req.method === 'GET') {
    const id = parseInt(urlPath.split('/')[3]);
    return handleGetProject(req, res, id);
  }
  if (urlPath.match(/^\/api\/projects\/\d+$/) && req.method === 'PUT') {
    const id = parseInt(urlPath.split('/')[3]);
    return handleUpdateProject(req, res, id);
  }
  if (urlPath.match(/^\/api\/projects\/\d+$/) && req.method === 'DELETE') {
    const id = parseInt(urlPath.split('/')[3]);
    return handleDeleteProject(req, res, id);
  }
  // 项目文件上传
  if (urlPath.match(/^\/api\/projects\/\d+\/files$/) && req.method === 'POST') {
    const id = parseInt(urlPath.split('/')[3]);
    return handleUploadProjectFile(req, res, id);
  }
  // 项目评论
  if (urlPath.match(/^\/api\/projects\/\d+\/comments$/) && req.method === 'GET') {
    const id = parseInt(urlPath.split('/')[3]);
    return handleListComments(req, res, id);
  }
  if (urlPath.match(/^\/api\/projects\/\d+\/comments$/) && req.method === 'POST') {
    const id = parseInt(urlPath.split('/')[3]);
    return handleCreateComment(req, res, id);
  }

  // 用户主页
  if (urlPath.match(/^\/api\/users\/[^/]+$/) && req.method === 'GET') {
    const username = urlPath.split('/')[3];
    return handleGetUserProfile(req, res, username);
  }
  if (urlPath.match(/^\/api\/users\/[^/]+\/projects$/) && req.method === 'GET') {
    const username = urlPath.split('/')[3];
    return handleListUserProjects(req, res, username);
  }
  if (urlPath.match(/^\/api\/users\/[^/]+\/followers$/) && req.method === 'GET') {
    const username = urlPath.split('/')[3];
    return handleGetFollowers(req, res, username);
  }
  if (urlPath.match(/^\/api\/users\/[^/]+\/following$/) && req.method === 'GET') {
    const username = urlPath.split('/')[3];
    return handleGetFollowing(req, res, username);
  }

  // 关注
  if (urlPath.match(/^\/api\/users\/[^/]+\/follow$/) && req.method === 'POST') {
    const username = urlPath.split('/')[3];
    return handleToggleFollow(req, res, username);
  }

  // 搜索
  if (urlPath === '/api/search' && req.method === 'GET') {
    return handleSearch(req, res);
  }

  // 动态时间线
  if (urlPath === '/api/feed' && req.method === 'GET') {
    return handleGetFeed(req, res);
  }

  return false;
}

// ========== 注册 ==========
async function handleRegister(req, res) {
  try {
    const body = await parseBody(req);
    const { username, email, password } = body;

    // 校验
    if (!username || !email || !password) {
      return sendError(res, 400, '用户名、邮箱和密码都不能为空');
    }
    if (username.length < 3 || username.length > 20) {
      return sendError(res, 400, '用户名长度需在 3-20 个字符之间');
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return sendError(res, 400, '用户名只能包含字母、数字、下划线和中文');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendError(res, 400, '邮箱格式不正确');
    }
    if (password.length < 6) {
      return sendError(res, 400, '密码至少 6 位');
    }

    const db = DB.get();

    // 检查用户名重复
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return sendError(res, 409, '用户名已被占用');
    }
    // 检查邮箱重复
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return sendError(res, 409, '邮箱已被注册');
    }

    // 创建用户
    const user = {
      id: DB.nextId(db, 'users'),
      username,
      email,
      passwordHash: hashPassword(password),
      avatar: '',
      bio: '',
      location: '',
      blog: '',
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    DB.save(db);

    // 自动登录
    const session = createSession(user.id);
    setCookie(res, 'sid', session.sid, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    sendJSON(res, 201, {
      message: '注册成功',
      user: sanitizeUser(user),
    });
  } catch (e) {
    console.error('注册错误:', e);
    const status = e.statusCode || 500;
    const message = status === 500 ? '服务器内部错误' : e.message;
    sendError(res, status, message);
  }
}

// ========== 登录 ==========
async function handleLogin(req, res) {
  try {
    const body = await parseBody(req);
    const { identifier, password } = body;

    if (!identifier || !password) {
      return sendError(res, 400, '账号和密码都不能为空');
    }

    // 支持用户名或邮箱登录
    let user = findUserByUsername(identifier);
    if (!user) user = findUserByEmail(identifier);

    if (!user) {
      return sendError(res, 401, '账号或密码错误');
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return sendError(res, 401, '账号或密码错误');
    }

    const session = createSession(user.id);
    setCookie(res, 'sid', session.sid, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    sendJSON(res, 200, {
      message: '登录成功',
      user: sanitizeUser(user),
    });
  } catch (e) {
    console.error('登录错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 登出 ==========
async function handleLogout(req, res) {
  try {
    const cookies = getCookies(req);
    const sid = cookies.sid;
    if (sid) destroySession(sid);
    clearCookie(res, 'sid');
    sendJSON(res, 200, { message: '已退出登录' });
  } catch (e) {
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 当前用户 ==========
async function handleMe(req, res) {
  const user = getCurrentUser(req);
  if (user) {
    sendJSON(res, 200, { user });
  } else {
    sendJSON(res, 200, { user: null });
  }
}

// ========== 更新个人资料 ==========
async function handleUpdateProfile(req, res) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录');

    const body = await parseBody(req);
    const db = DB.get();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return sendError(res, 404, '用户不存在');

    // 允许更新的字段
    if (body.bio !== undefined) dbUser.bio = body.bio;
    if (body.location !== undefined) dbUser.location = body.location;
    if (body.blog !== undefined) dbUser.blog = body.blog;
    if (body.avatar !== undefined) dbUser.avatar = body.avatar;

    // 用户名修改检查
    if (body.username && body.username !== dbUser.username) {
      if (body.username.length < 3 || body.username.length > 20) {
        return sendError(res, 400, '用户名长度需在 3-20 个字符之间');
      }
      if (db.users.find(u => u.username.toLowerCase() === body.username.toLowerCase() && u.id !== user.id)) {
        return sendError(res, 409, '用户名已被占用');
      }
      dbUser.username = body.username;
    }

    // 邮箱修改检查
    if (body.email && body.email !== dbUser.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return sendError(res, 400, '邮箱格式不正确');
      }
      if (db.users.find(u => u.email.toLowerCase() === body.email.toLowerCase() && u.id !== user.id)) {
        return sendError(res, 409, '邮箱已被使用');
      }
      dbUser.email = body.email;
    }

    DB.save(db);
    sendJSON(res, 200, {
      message: '资料已更新',
      user: sanitizeUser(dbUser),
    });
  } catch (e) {
    console.error('更新资料错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 修改密码 ==========
async function handleChangePassword(req, res) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录');

    const body = await parseBody(req);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, '当前密码和新密码都不能为空');
    }
    if (newPassword.length < 6) {
      return sendError(res, 400, '新密码至少 6 位');
    }

    const db = DB.get();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return sendError(res, 404, '用户不存在');

    if (!verifyPassword(currentPassword, dbUser.passwordHash)) {
      return sendError(res, 401, '当前密码不正确');
    }

    dbUser.passwordHash = hashPassword(newPassword);
    DB.save(db);

    sendJSON(res, 200, { message: '密码已更新' });
  } catch (e) {
    console.error('修改密码错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 星标列表 ==========
async function handleGetStars(req, res) {
  const user = getCurrentUser(req);
  if (!user) return sendJSON(res, 200, { stars: [] });

  const db = DB.get();
  const userStars = db.stars.filter(s => s.userId === user.id).map(s => s.projectId);
  sendJSON(res, 200, { stars: userStars });
}

// ========== 切换星标 ==========
async function handleToggleStar(req, res, projectId) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录后再收藏');

    const db = DB.get();
    const existing = db.stars.find(s => s.userId === user.id && s.projectId === projectId);

    if (existing) {
      // 取消星标
      db.stars = db.stars.filter(s => !(s.userId === user.id && s.projectId === projectId));
      DB.save(db);
      sendJSON(res, 200, { starred: false });
    } else {
      // 添加星标
      db.stars.push({
        id: DB.nextId(db, 'stars'),
        userId: user.id,
        projectId,
        createdAt: new Date().toISOString(),
      });
      DB.save(db);
      sendJSON(res, 200, { starred: true });
    }
  } catch (e) {
    console.error('星标操作错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 预设头像列表 ==========
const PRESET_AVATARS = [
  { id: 'fox', name: '小狐狸', url: '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu7li7ydq_ve_miaoda' },
  { id: 'wolf', name: '灰狼先生', url: '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4tqfaho_ve_miaoda' },
  { id: 'rabbit', name: '兔兔酱', url: '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu7li72iq_ve_miaoda' },
  { id: 'bear', name: '熊熊', url: '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4lbaqji_ve_miaoda' },
  { id: 'cat', name: '御姐猫', url: '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4tqfcao_ve_miaoda' },
  { id: 'dragon', name: '小龙龙', url: '/spark/app/app_17dze11t10r/runtime/api/v1/storage/object/bucket_aadkuvmen5eoi_static/static%2Faadkuu4zoicdg_ve_miaoda' },
];

// 确保上传目录存在
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads', 'avatars');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ========== 头像上传 ==========
async function handleUploadAvatar(req, res) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录');

    const contentType = req.headers['content-type'] || '';

    // 方式一：选择预设头像
    if (contentType.includes('application/json')) {
      const body = await parseBody(req);
      const { presetId } = body;
      if (!presetId) return sendError(res, 400, '请选择头像');

      const preset = PRESET_AVATARS.find(p => p.id === presetId);
      if (!preset) return sendError(res, 400, '头像不存在');

      const db = DB.get();
      const dbUser = db.users.find(u => u.id === user.id);
      if (!dbUser) return sendError(res, 404, '用户不存在');

      dbUser.avatar = preset.url;
      DB.save(db);

      return sendJSON(res, 200, {
        message: '头像已更新',
        avatar: preset.url,
        user: sanitizeUser(dbUser),
      });
    }

    // 方式二：上传图片文件（multipart/form-data 或 纯二进制）
    // 限制 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    let size = 0;
    const chunks = [];

    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_SIZE) {
        req.destroy();
        return sendError(res, 413, '图片大小不能超过 2MB');
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // 检测文件类型（通过魔数）
    let ext = null;
    let mime = null;
    if (buffer.length >= 8 && buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
      ext = 'png'; mime = 'image/png';
    } else if (buffer.length >= 3 && buffer.slice(0, 3).toString('hex') === 'ffd8ff') {
      ext = 'jpg'; mime = 'image/jpeg';
    } else if (buffer.length >= 6 && buffer.slice(0, 6).toString('hex').startsWith('47494638')) {
      ext = 'gif'; mime = 'image/gif';
    } else if (buffer.length >= 12 && buffer.slice(4, 12).toString('hex') === '6674797068656963') {
      ext = 'heic'; mime = 'image/heic';
    } else if (buffer.length >= 4 && buffer.slice(0, 4).toString('hex') === '52494646' && buffer.length >= 12 && buffer.slice(8, 12).toString('hex') === '57454250') {
      ext = 'webp'; mime = 'image/webp';
    }

    if (!ext) {
      return sendError(res, 400, '仅支持 PNG、JPG、GIF、WebP 格式的图片');
    }

    // 生成文件名
    const crypto = await import('node:crypto');
    const hash = crypto.default.createHash('md5').update(buffer).digest('hex').slice(0, 16);
    const filename = `avatar_${user.id}_${hash}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // 写入文件
    fs.writeFileSync(filePath, buffer);

    // 更新用户头像
    const db = DB.get();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) {
      fs.unlinkSync(filePath);
      return sendError(res, 404, '用户不存在');
    }

    // 清理旧的自定义头像文件（如果存在且在 uploads 目录下）
    const oldAvatar = dbUser.avatar;
    if (oldAvatar && oldAvatar.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(ROOT_DIR, oldAvatar);
      if (fs.existsSync(oldPath) && oldPath !== filePath) {
        try { fs.unlinkSync(oldPath); } catch (e) { /* 忽略 */ }
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`;
    dbUser.avatar = avatarUrl;
    DB.save(db);

    sendJSON(res, 200, {
      message: '头像上传成功',
      avatar: avatarUrl,
      user: sanitizeUser(dbUser),
    });
  } catch (e) {
    console.error('头像上传错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 获取预设头像列表 ==========
async function handleGetPresetAvatars(req, res) {
  sendJSON(res, 200, { avatars: PRESET_AVATARS });
}

// ========== 项目辅助函数 ==========
function getProjectStars(db, projectId) {
  return db.stars.filter(s => s.projectId == projectId).length;
}

function sanitizeProject(db, project) {
  if (!project) return null;
  const owner = db.users.find(u => u.id === project.ownerId);
  const stars = getProjectStars(db, project.id);
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    icon: project.icon || 'paw',
    desc: project.desc || '',
    language: project.language || '',
    langColor: project.langColor || '#ccc',
    visibility: project.visibility || '开源',
    topics: project.topics || [],
    featured: project.featured || false,
    readme: project.readme || '',
    files: project.files || [],
    ownerId: project.ownerId,
    owner: owner ? sanitizeUser(owner) : null,
    stars,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

// ========== 项目列表 ==========
async function handleListProjects(req, res) {
  try {
    const db = DB.get();
    const url = new URL(req.url, 'http://localhost');
    const sort = url.searchParams.get('sort') || 'updated';
    const topic = url.searchParams.get('topic') || '';
    const search = url.searchParams.get('q') || '';

    let projects = [...db.projects];

    if (topic) {
      projects = projects.filter(p => (p.topics || []).includes(topic));
    }

    if (search) {
      const q = search.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.desc || '').toLowerCase().includes(q) ||
        (p.topics || []).some(t => t.toLowerCase().includes(q))
      );
    }

    // 排序
    if (sort === 'stars') {
      projects.sort((a, b) => getProjectStars(db, b.id) - getProjectStars(db, a.id));
    } else if (sort === 'created') {
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    const result = projects.map(p => sanitizeProject(db, p));
    sendJSON(res, 200, { projects: result, total: result.length });
  } catch (e) {
    console.error('项目列表错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 获取项目详情 ==========
async function handleGetProject(req, res, id) {
  try {
    const db = DB.get();
    const project = db.projects.find(p => p.id === id);
    if (!project) return sendError(res, 404, '项目不存在');
    sendJSON(res, 200, { project: sanitizeProject(db, project) });
  } catch (e) {
    console.error('项目详情错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 创建项目 ==========
async function handleCreateProject(req, res) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录');

    const body = await parseBody(req);
    const { name, desc, language, langColor, topics, readme, icon } = body;

    if (!name || !name.trim()) return sendError(res, 400, '项目名称不能为空');
    if (name.length > 50) return sendError(res, 400, '项目名称不能超过 50 个字符');

    // slug 生成：小写 + 连字符
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);
    if (!slug) return sendError(res, 400, '项目名称不合法');

    const db = DB.get();

    // 同一用户下项目名不能重复
    if (db.projects.find(p => p.ownerId === user.id && p.name.toLowerCase() === name.toLowerCase())) {
      return sendError(res, 409, '你已经有同名项目了');
    }

    const now = new Date().toISOString();
    const project = {
      id: DB.nextId(db, 'projects'),
      slug,
      name: name.trim(),
      icon: icon || 'paw',
      desc: (desc || '').trim(),
      language: language || '',
      langColor: langColor || '#ccc',
      visibility: '开源',
      topics: Array.isArray(topics) ? topics.filter(Boolean).slice(0, 10) : [],
      featured: false,
      readme: readme || '',
      files: [],
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    db.projects.push(project);
    DB.save(db);

    sendJSON(res, 201, {
      message: '项目创建成功 🐾',
      project: sanitizeProject(db, project),
    });
  } catch (e) {
    console.error('创建项目错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 更新项目 ==========
async function handleUpdateProject(req, res, id) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录');

    const db = DB.get();
    const project = db.projects.find(p => p.id === id);
    if (!project) return sendError(res, 404, '项目不存在');
    if (project.ownerId !== user.id) return sendError(res, 403, '你没有权限编辑此项目');

    const body = await parseBody(req);
    const { name, desc, language, langColor, topics, readme, icon } = body;

    if (name !== undefined) {
      if (!name.trim()) return sendError(res, 400, '项目名称不能为空');
      project.name = name.trim();
    }
    if (desc !== undefined) project.desc = desc.trim();
    if (language !== undefined) project.language = language;
    if (langColor !== undefined) project.langColor = langColor;
    if (icon !== undefined) project.icon = icon;
    if (topics !== undefined) project.topics = Array.isArray(topics) ? topics.filter(Boolean).slice(0, 10) : [];
    if (readme !== undefined) project.readme = readme;

    project.updatedAt = new Date().toISOString();
    DB.save(db);

    sendJSON(res, 200, {
      message: '项目已更新 ✨',
      project: sanitizeProject(db, project),
    });
  } catch (e) {
    console.error('更新项目错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 删除项目 ==========
async function handleDeleteProject(req, res, id) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录');

    const db = DB.get();
    const idx = db.projects.findIndex(p => p.id === id);
    if (idx === -1) return sendError(res, 404, '项目不存在');
    if (db.projects[idx].ownerId !== user.id) return sendError(res, 403, '你没有权限删除此项目');

    // 删除关联数据
    db.stars = db.stars.filter(s => s.projectId != id);
    db.comments = (db.comments || []).filter(c => c.projectId !== id);
    db.projects.splice(idx, 1);
    DB.save(db);

    sendJSON(res, 200, { message: '项目已删除' });
  } catch (e) {
    console.error('删除项目错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 项目文件上传 ==========
const PROJECT_FILES_DIR = path.join(ROOT_DIR, 'uploads', 'projects');
if (!fs.existsSync(PROJECT_FILES_DIR)) {
  fs.mkdirSync(PROJECT_FILES_DIR, { recursive: true });
}

async function handleUploadProjectFile(req, res, projectId) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录');

    const db = DB.get();
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return sendError(res, 404, '项目不存在');
    if (project.ownerId !== user.id) return sendError(res, 403, '你没有权限上传文件');

    // 读取文件名（从 X-Filename header 获取）
    const filename = req.headers['x-filename'] || decodeURIComponent(req.headers['x-file-name'] || '');
    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 100) || 'unnamed';
    const contentType = req.headers['content-type'] || 'application/octet-stream';

    // 限制 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_SIZE) {
        req.destroy();
        return sendError(res, 413, '文件大小不能超过 5MB');
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const crypto = await import('node:crypto');
    const hash = crypto.default.createHash('md5').update(buffer).digest('hex').slice(0, 8);
    const ext = safeFilename.includes('.') ? safeFilename.split('.').pop() : 'txt';
    const storedName = `p${projectId}_${hash}_${safeFilename}`;
    const projectDir = path.join(PROJECT_FILES_DIR, String(projectId));
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
    const filePath = path.join(projectDir, storedName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/projects/${projectId}/${storedName}`;
    const fileEntry = {
      id: DB.nextId(db, 'projectFiles') || Date.now(),
      name: safeFilename,
      url: fileUrl,
      size: buffer.length,
      type: contentType,
      uploadedAt: new Date().toISOString(),
    };

    if (!project.files) project.files = [];
    project.files.push(fileEntry);
    project.updatedAt = new Date().toISOString();
    DB.save(db);

    sendJSON(res, 200, {
      message: '文件上传成功',
      file: fileEntry,
      project: sanitizeProject(db, project),
    });
  } catch (e) {
    console.error('文件上传错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 评论列表 ==========
async function handleListComments(req, res, projectId) {
  try {
    const db = DB.get();
    const comments = (db.comments || [])
      .filter(c => c.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(c => {
        const user = db.users.find(u => u.id === c.userId);
        return {
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          user: user ? sanitizeUser(user) : null,
        };
      });

    sendJSON(res, 200, { comments, total: comments.length });
  } catch (e) {
    console.error('评论列表错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 发表评论 ==========
async function handleCreateComment(req, res, projectId) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录后再评论');

    const db = DB.get();
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return sendError(res, 404, '项目不存在');

    const body = await parseBody(req);
    const { content } = body;

    if (!content || !content.trim()) return sendError(res, 400, '评论内容不能为空');
    if (content.length > 500) return sendError(res, 400, '评论不能超过 500 个字符');

    const comment = {
      id: DB.nextId(db, 'comments'),
      projectId,
      userId: user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    if (!db.comments) db.comments = [];
    db.comments.push(comment);
    DB.save(db);

    sendJSON(res, 201, {
      message: '评论发表成功',
      comment: {
        ...comment,
        user: sanitizeUser(db.users.find(u => u.id === user.id)),
      },
    });
  } catch (e) {
    console.error('发表评论错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 用户主页详情 ==========
async function handleGetUserProfile(req, res, username) {
  try {
    const db = DB.get();
    const targetUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return sendError(res, 404, '用户不存在');

    const projectCount = db.projects.filter(p => p.ownerId === targetUser.id).length;
    const starCount = db.projects
      .filter(p => p.ownerId === targetUser.id)
      .reduce((sum, p) => sum + getProjectStars(db, p.id), 0);
    const followerCount = (db.follows || []).filter(f => f.followingId === targetUser.id).length;
    const followingCount = (db.follows || []).filter(f => f.followerId === targetUser.id).length;

    // 当前用户是否已关注
    const currentUser = getCurrentUser(req);
    let isFollowing = false;
    if (currentUser) {
      isFollowing = (db.follows || []).some(f => f.followerId === currentUser.id && f.followingId === targetUser.id);
    }

    sendJSON(res, 200, {
      user: sanitizeUser(targetUser),
      stats: {
        projectCount,
        starCount,
        followerCount,
        followingCount,
      },
      isFollowing,
      isOwn: currentUser && currentUser.id === targetUser.id,
    });
  } catch (e) {
    console.error('用户主页错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 用户项目列表 ==========
async function handleListUserProjects(req, res, username) {
  try {
    const db = DB.get();
    const targetUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return sendError(res, 404, '用户不存在');

    const projects = db.projects
      .filter(p => p.ownerId === targetUser.id)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map(p => sanitizeProject(db, p));

    sendJSON(res, 200, { projects, total: projects.length });
  } catch (e) {
    console.error('用户项目列表错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 切换关注 ==========
async function handleToggleFollow(req, res, username) {
  try {
    const user = getCurrentUser(req);
    if (!user) return sendError(res, 401, '请先登录后再关注');

    const db = DB.get();
    const targetUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return sendError(res, 404, '用户不存在');
    if (targetUser.id === user.id) return sendError(res, 400, '不能关注自己');

    if (!db.follows) db.follows = [];

    const existing = db.follows.find(f => f.followerId === user.id && f.followingId === targetUser.id);
    if (existing) {
      // 取消关注
      db.follows = db.follows.filter(f => !(f.followerId === user.id && f.followingId === targetUser.id));
      DB.save(db);
      const followerCount = db.follows.filter(f => f.followingId === targetUser.id).length;
      sendJSON(res, 200, { following: false, followerCount });
    } else {
      // 关注
      db.follows.push({
        id: DB.nextId(db, 'follows'),
        followerId: user.id,
        followingId: targetUser.id,
        createdAt: new Date().toISOString(),
      });
      DB.save(db);
      const followerCount = db.follows.filter(f => f.followingId === targetUser.id).length;
      sendJSON(res, 200, { following: true, followerCount });
    }
  } catch (e) {
    console.error('关注操作错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 获取粉丝列表 ==========
async function handleGetFollowers(req, res, username) {
  try {
    const db = DB.get();
    const targetUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return sendError(res, 404, '用户不存在');

    const followers = (db.follows || [])
      .filter(f => f.followingId === targetUser.id)
      .map(f => {
        const u = db.users.find(x => x.id === f.followerId);
        return u ? sanitizeUser(u) : null;
      })
      .filter(Boolean);

    sendJSON(res, 200, { users: followers, total: followers.length });
  } catch (e) {
    console.error('粉丝列表错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 获取关注列表 ==========
async function handleGetFollowing(req, res, username) {
  try {
    const db = DB.get();
    const targetUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return sendError(res, 404, '用户不存在');

    const following = (db.follows || [])
      .filter(f => f.followerId === targetUser.id)
      .map(f => {
        const u = db.users.find(x => x.id === f.followingId);
        return u ? sanitizeUser(u) : null;
      })
      .filter(Boolean);

    sendJSON(res, 200, { users: following, total: following.length });
  } catch (e) {
    console.error('关注列表错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 全局搜索 ==========
async function handleSearch(req, res) {
  try {
    const db = DB.get();
    const url = new URL(req.url, 'http://localhost');
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();

    if (!q) return sendJSON(res, 200, { projects: [], users: [] });

    // 搜索项目
    const projects = db.projects
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.desc || '').toLowerCase().includes(q) ||
        (p.topics || []).some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 10)
      .map(p => sanitizeProject(db, p));

    // 搜索用户
    const users = db.users
      .filter(u =>
        u.username.toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q)
      )
      .slice(0, 10)
      .map(u => sanitizeUser(u));

    sendJSON(res, 200, { projects, users });
  } catch (e) {
    console.error('搜索错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 动态时间线 ==========
async function handleGetFeed(req, res) {
  try {
    const db = DB.get();
    const url = new URL(req.url, 'http://localhost');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 按创建时间倒序的项目列表
    const projects = [...db.projects]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit)
      .map(p => sanitizeProject(db, p));

    sendJSON(res, 200, { items: projects, hasMore: offset + limit < db.projects.length });
  } catch (e) {
    console.error('动态时间线错误:', e);
    sendError(res, 500, '服务器内部错误');
  }
}

// ========== 初始化默认用户密码与头像 ==========
function initDefaultUser() {
  const db = DB.get();
  const foxie = db.users.find(u => u.username === 'foxiepaws');
  if (foxie && !foxie.passwordHash) {
    foxie.passwordHash = hashPassword('foxie123');
    if (!foxie.avatar) {
      foxie.avatar = PRESET_AVATARS[0].url;
    }
    DB.save(db);
    console.log('🐾 已初始化默认用户: foxiepaws / foxie123');
  }
}

// ========== 启动服务 ==========
const server = http.createServer(async (req, res) => {
  const rawPath = decodeURIComponent(req.url.split('?')[0]);

  // 请求日志（便于排查部署环境请求路径问题）
  console.log(`[REQ] ${req.method} ${rawPath}`);

  // 兼容部署前缀：平台可能部署在 /spark/app/<app-id>/ 或 /app/<app-id>/ 等子路径下
  // 通用逻辑：从 URL 中找到 /api/ 段，把它之前的都当作前缀剥离
  // 这样无论是什么前缀格式都能正确路由
  let urlPath = rawPath;
  const apiIdx = rawPath.indexOf('/api/');
  if (apiIdx > 0) {
    urlPath = rawPath.slice(apiIdx);
    console.log(`[ROUTE] 前缀剥离: ${rawPath} -> ${urlPath}`);
  }

  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 请求
  if (urlPath.startsWith('/api/')) {
    const handled = await handleAPI(req, res, urlPath);
    if (handled !== false) return;
    return sendError(res, 404, '接口不存在');
  }

  // 静态文件服务（传入原始路径以便匹配 /spark/ 前缀的资源）
  const isStatic = serveStatic(req, res, rawPath);
  if (!isStatic) {
    // 返回 index.html（SPA 路由）
    const indexPath = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } else {
      sendError(res, 404, '页面不存在');
    }
  }
});

initDefaultUser();

server.listen(PORT, () => {
  console.log(`🐾 爪印代码库服务已启动: http://localhost:${PORT}`);
  console.log(`   默认账号: foxiepaws / foxie123`);
});
