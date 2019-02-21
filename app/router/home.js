// app/router/home.js

const router = require('koa-router')();

router.get('/', async (ctx, next) => {
    await ctx.render('index', {title: 'Home', link: 'index'});
});

module.exports = router;