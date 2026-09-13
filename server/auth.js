// 密码哈希 & 会话管理，基于 Node.js 内置 crypto
import crypto from 'node:crypto';
import { DB } from './db.js';

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

// ========== 密码哈希 ==========
// 使用 PBKDF2 + salt，强度足够且零依赖
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [algo, iterations, salt, hash] = storedHash.split('$');
    if (algo !== 'pbkdf2') return false;
    const derived = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 64, 'sha512').toString('hex');
    // 恒定时间比较，防止时序攻击
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
  } catch (e) {
    return false;
  }
}

// ========== 会话 ==========
function createSession(userId) {
  const db = DB.get();
  const sid = crypto.randomBytes(32).toString('hex');
  const session = {
    sid,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL).toISOString(),
  };
  db.sessions.push(session);
  // 清理过期会话
  db.sessions = db.sessions.filter(s => new Date(s.expiresAt) > new Date());
  DB.save(db);
  return session;
}

function getSession(sid) {
  const db = DB.get();
  const session = db.sessions.find(s => s.sid === sid);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    // 过期，删除
    db.sessions = db.sessions.filter(s => s.sid !== sid);
    DB.save(db);
    return null;
  }
  return session;
}

function destroySession(sid) {
  const db = DB.get();
  db.sessions = db.sessions.filter(s => s.sid !== sid);
  DB.save(db);
}

// ========== 用户查找 ==========
function findUserById(id) {
  const db = DB.get();
  return db.users.find(u => u.id === id) || null;
}

function findUserByUsername(username) {
  const db = DB.get();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function findUserByEmail(email) {
  const db = DB.get();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// 去掉敏感字段的用户对象
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export {
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  sanitizeUser,
};
