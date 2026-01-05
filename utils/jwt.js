const jwt = require('jsonwebtoken');
const jwtUtils = require('../utils/auth');

// 从环境变量读取密钥，开发环境使用默认值
const ACCESS_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_123';
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_456';

/**
 * 生成访问令牌（Access Token）
 * 有效期：15分钟（开发环境可延长方便测试）
 */
exports.generateAccessToken = (userId) => {
  const expiresIn = process.env.NODE_ENV === 'development' ? '1h' : '15m';
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn });
};

/**
 * 生成刷新令牌（Refresh Token）
 * 有效期：7天
 */
exports.generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * 验证访问令牌
 * 成功返回payload，失败返回null
 */
exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    console.log('Access Token验证失败:', error.message);
    return null;
  }
};

/**
 * 验证刷新令牌
 * 成功返回payload，失败返回null
 */
exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    console.log('Refresh Token验证失败:', error.message);
    return null;
  }
};
