const Koa = require('koa');
const cors = require('@koa/cors');
const { koaBody } = require('koa-body');
const path = require('path');
const fs = require('fs');
const { accessLogger } = require('./utils/logger');
const app = new Koa();

app.proxy = true;

const router = require('./routes');

app.use(accessLogger());
app.use(
  cors({
    origin: '*', // 允许所有来源
    credentials: true, // 允许发送 Cookie
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(require('koa-static')(__dirname + '/public'));
app.use(
  koaBody({
    // 开启 multipart/form-data 支持
    multipart: true,

    // 表单字段配置
    formidable: {
      // 上传目录
      uploadDir: path.join(__dirname, 'uploads'),

      // 保持文件扩展名
      keepExtensions: true,

      // 最大文件大小（默认 2MB）
      maxFileSize: 10 * 1024 * 1024, // 10MB

      // 文件上传进度
      onFileBegin: (name, file) => {
        console.log(`开始上传文件: ${name}`);
      }
    },

    // JSON 限制
    jsonLimit: '1mb',

    // 表单限制
    formLimit: '56kb',

    // 文本限制
    textLimit: '56kb',

    // 严格模式
    strict: true,

    // 解析 Query String
    parsedMethods: ['POST', 'PUT', 'PATCH', 'DELETE']
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
