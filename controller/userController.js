const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const MUser = require('../models/userModel.js');
const { logger } = require('../utils/logger');
const jwtUtils = require('../utils/jwt');
const { idGenerator } = require('../utils/IdHelper');

const saltRounds = 10;

const SHRT_TOKEN_SECRET =
  process.env.SHRT_TOKEN_SECRET || 'dev_access_secret_123';
const LONG_TOKEN_SECRET =
  process.env.LONG_TOKEN_SECRET || 'dev_refresh_secret_456';

// ============================================
// 模拟数据库存储refresh tokens
// 实际项目要用Redis或数据库
// ============================================
let refreshTokens = [];

class UserController {
  async register(ctx) {
    const data = ctx.request.body;
    console.log(data);
    const username = data.username;
    const password = data.password;
    const email = data.email;
    const bio = data.bio;
    const avat = data.avat;
    let user = {};
    if (!username || !password) {
      ctx.body = {
        code: 44,
        msg: 'MISSING INFORMATION'
      };
      return;
    }
    user.username = username;
    user.password = password;
    if (email) {
      user.email = email;
    } else {
      user.email = 'example@email.com';
    }
    if (bio) {
      user.bio = bio;
    } else {
      user.bio = 'i am good';
    }
    if (avat) {
      user.avat = avat;
    } else {
      user.avat = 'http://localhost:3000/title.png';
    }
    const res = await MUser.register(user);

    logger.info('user ' + username + ' register result: ' + res);
    if (res.code == 34) {
      ctx.body = {
        code: 34,
        msg: 'succ'
      };
      return;
    }
    ctx.body = {
      code: 44,
      msg: res.msg
    };
  }
  async login(ctx) {
    const { username, password } = ctx.request.body;
    if (!username || !password) {
      ctx.body = {
        code: 44,
        msg: 'fail'
      };
      return;
    }
    const user = await MUser.login(username);
    if (!user) {
      ctx.body = {
        code: '44',
        msg: 'fail'
      };
      return;
    }
    console.log(password, user.auth);
    const isMatch = await bcrypt.compare(password, user.auth);
    if (!isMatch) {
      ctx.body = {
        code: '44',
        msg: 'fail'
      };
      return;
    }
    let userdb = await MUser.findById(user.bid);
    const userinfo = {
      id: userdb.bid,
      username: userdb.user
    };
    console.log(userinfo);
    const longToken = jwt.sign({ user: userinfo }, LONG_TOKEN_SECRET, {
      expiresIn: '30d'
    });
    const shrtToken = jwt.sign({ user: userinfo }, SHRT_TOKEN_SECRET, {
      expiresIn: '10m'
    });

    // 3. 存储refresh token（模拟数据库存储）
    refreshTokens.push(longToken);
    console.log('生成的refresh token已存储，当前数量:', refreshTokens.length);

    ctx.cookies.set('user_sess_save', longToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict', //lax, strict
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    ctx.cookies.set('user_sess', shrtToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax', //lax, strict
      maxAge: 10 * 60 * 1000
    });
    ctx.cookies.set('logged_in', 'yes', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict'
    });
    ctx.body = {
      code: 34,
      msg: 'succ',
      user: userinfo
    };
  }

  async refreshToken(ctx) {
    console.log('刷新token请求');

    // 1. 从Cookie获取refresh token
    const refreshToken = ctx.cookies.get('refresh_token');

    if (!refreshToken) {
      ctx.status = 401;
      ctx.body = {
        error: '未提供refresh token',
        code: 'NO_REFRESH_TOKEN'
      };
      return;
    }

    // 2. 验证refresh token是否在存储中
    if (!refreshTokens.includes(refreshToken)) {
      ctx.status = 401;
      ctx.body = {
        error: '无效的refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      };
      return;
    }

    // 3. 验证refresh token是否有效
    const payload = jwtUtils.verifyRefreshToken(refreshToken);
    if (!payload) {
      ctx.status = 401;
      ctx.body = {
        error: 'refresh token已过期',
        code: 'REFRESH_TOKEN_EXPIRED'
      };
      return;
    }

    // 4. 生成新的access token
    const newAccessToken = jwtUtils.generateAccessToken(payload.userId);

    console.log('Token刷新成功，用户ID:', payload.userId);

    // 5. 返回新的access token
    ctx.body = {
      success: true,
      access_token: newAccessToken,
      expires_in: 3600 // 开发环境1小时
    };
  }
  async getUserInfo(ctx) {
    const userId = ctx.state.user.id;

    console.log('获取用户信息，用户ID:', userId);

    // 查找用户
    const user = users.find((u) => u.id === userId);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      };
      return;
    }

    // 返回用户信息（排除密码）
    const { password, ...safeUser } = user;

    ctx.body = {
      success: true,
      user: safeUser
    };
  }
  async logout(ctx) {
    console.log('登出请求');

    // 1. 获取refresh token
    const refreshToken = ctx.cookies.get('user_sess_save');

    if (refreshToken) {
      // 2. 从存储中移除（模拟数据库删除）
      const initialLength = refreshTokens.length;
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
      console.log(
        `移除了refresh token，数量: ${initialLength} -> ${refreshTokens.length}`
      );

      // 3. 清除Cookie
      ctx.cookies.set('user_sess_save', null, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 0 // 立即过期
      });
      ctx.cookies.set('user_sess', null, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 0 // 立即过期
      });
      ctx.cookies.set('logged_in', null, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 0
      });
    }

    ctx.body = {
      success: true,
      message: '登出成功'
    };
  }
  async test(ctx) {
    ctx.body = {
      success: true,
      message: '后端API运行正常',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
  async myAuth(ctx) {
    if (ctx.cookies.get('logged_in') !== 'yes') {
      ctx.body = {};
      return;
    }
    const userId = ctx.state.user.id;
    const user = await MUser.findById(userId);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      };
      return;
    }
    // 返回用户信息（排除密码）
    const { password, ...safeUser } = user;
    let userifno = {
      id: safeUser.bid,
      username: safeUser.user,
      email: safeUser.email,
      avat: safeUser.avat,
      bio: safeUser.bio
    };
    ctx.body = {
      code: 34,
      msg: 'SUCC',
      user: userifno
    };
  }
  async changeEmail(ctx) {}
  async changeBio(ctx) {}
  async changeAvat(ctx) {}
  async changePassword(ctx) {}
  async changeUsername(ctx) {}
  async setLocale(ctx) {
    const { locale } = ctx.request.body;
    if (locale) {
      console.log(locale);
      ctx.cookies.set('locale', locale, {
        httpOnly: false,
        secure: false,
        maxAge: 31536 * 1000
      });
      ctx.body = {
        code: 34,
        msg: 'SUCC'
      };
    } else {
      ctx.body = {
        code: 44,
        msg: 'FAILD'
      };
    }
  }
}

module.exports = new UserController();
