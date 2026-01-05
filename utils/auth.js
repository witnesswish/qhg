// backend/utils/auth.js
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const SHRT_TOKEN_SECRET =
  process.env.SHRT_TOKEN_SECRET || 'dev_access_secret_123';
const LONG_TOKEN_SECRET =
  process.env.LONG_TOKEN_SECRET || 'dev_refresh_secret_456';

let userinfo = {
  id: null,
  username: null,
  nickname: null,
  version: null
};
class auth {
  async login(ctx, next) {
    if (ctx.cookies.get('logged_in') !== 'yes') {
      ctx.status = 401;
      ctx.body = {
        code: 66,
        msg: 'EXECUTE ORDER 66'
      };
      return;
    }
    let shrtToken = ctx.cookies.get('user_sess');
    let longToken = ctx.cookies.get('user_sess_save');

    if (!shrtToken) {
      if (!longToken) {
        logger.warn('未提供token: ip:', ctx.ip, 'path:', ctx.path);
        ctx.status = 401;
        ctx.body = { code: 66, msg: 'EXECUTE ORDER 66' };
        return;
      } else {
        const decoded = jwt.verify(longToken, LONG_TOKEN_SECRET);
        userinfo = decoded.user;
        console.log('de: ', decoded.user);
        ctx.state.user = userinfo;
        const token = jwt.sign(
          {
            user: userinfo
          },
          SHRT_TOKEN_SECRET,
          { expiresIn: '10m' }
        );
        ctx.cookies.set('user_sess', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 10 * 60 * 1000
        });
        await next();
      }
    } else {
      try {
        const decoded = jwt.verify(shrtToken, SHRT_TOKEN_SECRET);
        ctx.state.user = decoded.user;
        console.log('认证通过,info: ', decoded.user);
        await next();
      } catch (error) {
        console.log(error);
        ctx.status = 401;
        ctx.body = { error: '登录已过期，请重新登录' };
      }
    }
  }
  async me(ctx, next) {
    if (ctx.cookies.get('logged_in') !== 'yes') {
      ctx.body = {
        code: 66,
        msg: 'EXECUTE ORDER 66'
      };
      return;
    }
    let shrtToken = ctx.cookies.get('user_sess');
    let longToken = ctx.cookies.get('user_sess_save');
    if (!shrtToken) {
      if (!longToken) {
        logger.warn('未提供token: ip:', ctx.ip, 'path:', ctx.path);
        ctx.body = { code: 66, msg: 'EXECUTE ORDER 66' };
        return;
      } else {
        const decoded = jwt.verify(longToken, LONG_TOKEN_SECRET);
        userinfo = decoded.user;
        console.log('de: ', decoded.user);
        ctx.state.user = userinfo;
        const token = jwt.sign(
          {
            user: userinfo
          },
          SHRT_TOKEN_SECRET,
          { expiresIn: '10m' }
        );
        ctx.cookies.set('user_sess', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 10 * 60 * 1000
        });
        await next();
      }
    } else {
      try {
        const decoded = jwt.verify(shrtToken, SHRT_TOKEN_SECRET);
        ctx.state.user = decoded.user;
        console.log('认证通过,info: ', decoded.user);
        await next();
      } catch (error) {
        console.log(error);
        ctx.status = 401;
        ctx.body = { error: '登录已过期，请重新登录' };
      }
    }
  }
}

// 直接导出这个中间件函数
module.exports = new auth();
