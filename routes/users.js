const router = require('koa-router')();

const userController = require('../controller/userController');
const auth = require('../utils/auth');

router.prefix('/users');

router.post('/register', userController.register);

router.post('/login', userController.login);
router.post('/logout', userController.logout);

router.post('/change/email', userController.changeEmail);
router.post('/change/bio', userController.changeBio);
router.post('/change/avat', userController.changeAvat);
router.post('/change/password', userController.changePassword);
router.post('/change/username', userController.changeUsername);

router.post('/:username', auth.login, userController.getUserInfo);
router.post('/me/auth', auth.me, userController.myAuth);

router.post('/set/locale', userController.setLocale);

router.get('/test', userController.test);

module.exports = router;
