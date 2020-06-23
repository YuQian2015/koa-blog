// app/router/index.js

const { article } = require('../controller'); // 引入config
console.log(article);

const Router = require('koa-router');
const config = require('config'); // 引入config
const apiPrefix = config.get('Router.apiPrefix');
const router = new Router();
router.prefix(apiPrefix); // 设置路由前缀
const home = require('./home');

const index = async (ctx, next) => {
    await ctx.render('index', {title: 'Index', link: 'home'});
};

router.get('/', index);
router.get('/index', index);
router.get('/article', article.create);
router.use('/home', home.routes(), home.allowedMethods()); // 设置home的路由

module.exports = router;