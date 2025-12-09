const Koa = require('koa')
const app = new Koa()

app.proxy = true;

const router = require('./routes');

app.use(require('koa-static')(__dirname + '/public'))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(router.routes());
app.use(router.allowedMethods());



module.exports = app
