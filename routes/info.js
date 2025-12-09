const router = require('koa-router')();

const infoController = require('../controller/infoController');
const auth = require('../utils/auth');

router.prefix('/info');

router.get('/ip', infoController.ip);

module.exports = router;
