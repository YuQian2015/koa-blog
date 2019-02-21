// app/router/index.js

const config = require('../../config/config');

const Router = require('koa-router');
const router = new Router();
router.prefix(config.API_PREFIX); // 设置路由前缀
const home = require('./home');

const index = async (ctx, next) => {
    await ctx.render('index', {title: 'Index', link: 'home'});
};

router.get('/', index);
router.get('/index', index);
router.use('/home', home.routes(), home.allowedMethods()); // 设置home的路由

module.exports = router;