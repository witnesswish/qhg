const router = require('koa-router')()
const testController = require('../controller/testController')

router.prefix('/test')

router.get('/', testController.index);
module.exports = router
