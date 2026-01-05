const dotenv = require('dotenv');

dotenv.config();

const Koa = require('koa');
const cors = require('@koa/cors');
const { koaBody } = require('koa-body');
const path = require('path');
const { accessLogger } = require('./utils/logger');
const app = new Koa();

app.proxy = true;

const router = require('./routes');

app.use(accessLogger());
app.use(
  cors({
    origin: '*', // 允许所有来源
    credentials: true, // 允许发送 Cookie
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    //allowHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(require('koa-static')(__dirname + '/public'));
app.use(
  koaBody({
    multipart: false, // 默认不处理文件上传
    jsonLimit: '1mb', // JSON大小限制
    formLimit: '56kb', // 表单大小限制
    textLimit: '56kb', // 文本大小限制
    parsedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] // 解析的方法
  })
);
// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
app.use(router.routes());
app.use(router.allowedMethods());

module.exports = app;
