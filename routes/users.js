const router = require('koa-router')();

const userController = require('../controller/userController');
const auth = require('../utils/auth');

router.prefix('/users');

router.post('/login', userController.login);
router.get('/test', auth, userController.test);
router.post('/logout', userController.logout);
router.post('/get/new/token', userController.refreshToken);

module.exports = router;
