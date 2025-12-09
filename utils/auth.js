// backend/utils/auth.js
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const SECRET_KEY = 'your-secret-key-change-this';

// 直接写一个中间件函数，不用工厂模式
async function auth(ctx, next) {
  // 1. 从请求头获取token
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('unauthorized access: ip:', ctx.ip, 'path:', ctx.path);
    ctx.status = 401;
    ctx.body = { error: '请先登录' };
    return;
  }

  // 2. 提取token
  const token = authHeader.split(' ')[1];

  try {
    // 3. 验证token
    const decoded = jwt.verify(token, SECRET_KEY);

    // 4. 把用户信息挂到ctx.state
    ctx.state.user = {
      id: decoded.userId,
      username: decoded.username
    };

    // 5. 继续执行
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: '登录已过期，请重新登录' };
  }
}

// 直接导出这个中间件函数
module.exports = auth;
