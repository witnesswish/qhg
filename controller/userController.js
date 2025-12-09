const axios = require('axios');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const SECRET_KEY = 'your-secret-key-change-this';

class UserController {
  async login(ctx) {
    const { username, password } = ctx.request.body;
    if (username === 'admin' && password === '123456') {
      // 生成JWT
      const token = jwt.sign(
        {
          username: username,
          expiresIn: '5m'
        },
        SECRET_KEY
      );
      const grass = jwt.sign(
        {
          username: username,
          expiresIn: '7d'
        },
        SECRET_KEY
      );
      ctx.cookies.set('jwt', grass, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // secure: true,      // HTTPS时开启
        sameSite: 'strict' // 防CSRF
      });
      logger.info(username, ' login success on ', ctx.ip);
      logger.warn('warn');
      logger.error('error');
      ctx.body = { code: 34, user: { username }, token: token };
    } else {
      ctx.status = 401;
      ctx.body = { success: false, message: '用户名或密码错误' };
    }
  }
  async refreshToken(ctx) {
    const token = jwt.sign(
      {
        username: username,
        expiresIn: '5m'
      },
      SECRET_KEY
    );
  }
  async logout(ctx) {
    ctx.cookies.set('jwt', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/'
    });
    ctx.body = {
      code: 34
    };
  }
  async test(ctx) {
    ctx.body = {
      code: 34,
      msg: 'ok'
    };
  }
}

module.exports = new UserController();
