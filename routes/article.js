const router = require('koa-router')();
const articleController = require('../controller/articleController');
const auth = require('../utils/auth');

router.prefix('/article');

router.get('/get/tags', auth.login, articleController.getTags);
router.get('/get/categories', auth.login, articleController.getCategories);

router.get('/get/article/public', articleController.getPublic);
router.get('/get/public/devlog', articleController.getPublicDevlog);
router.get('/get/public/detail/:slug', articleController.getPublicDetail);

router.post('/new/article', auth.login, articleController.newArticle);

router.get('/search/title', articleController.searchTitle);

router.post('/upload/content/image', articleController.uploadContentImage);
router.post('/upload/content/video', articleController.uploadContentVideo);

router.post('/test', articleController.test);
module.exports = router;
