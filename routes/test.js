const router = require('koa-router')()

router.prefix('/test')

router.get('/', function (ctx, next) {
    const ip = ctx.ip;
  ctx.body = {
    code: 200,
    ip: ip
  }
})
module.exports = router
