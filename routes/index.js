const router = require('koa-router')();
const fs = require('fs');

fs.readdirSync(__dirname).forEach((file) => {
  if (file !== 'index.js' && file.endsWith('.js')) {
    const subRouter = require(`./${file}`);
    const routeName = file.replace('.js', '');

    // 关键修复：检查subRouter是否有前缀配置
    if (subRouter.opts && subRouter.opts.prefix) {
      // 如果子路由有自己的前缀，直接使用
      router.use(subRouter.routes(), subRouter.allowedMethods());
      console.log(`✅ 已加载路由: ${file} -> ${subRouter.opts.prefix}`);
    } else {
      // 否则使用文件名作为前缀
      router.use(
        `/${routeName}`,
        subRouter.routes(),
        subRouter.allowedMethods()
      );
      console.log(`✅ 已加载路由: ${file} -> /${routeName}`);
    }
  }
});

module.exports = router;
