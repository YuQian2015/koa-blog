// app.js
require('dotenv-safe').config(); // 只需要引入一次
const Koa = require('koa');
const config = require('config'); // 引入config
const appConfig = config.get('App'); // 直接使用 config 获取App的配置
const apiPrefix = config.get('Router.apiPrefix'); // 可以通过Router.apiPrefix获取具体的值
const dbConfig = config.get('Database');
const { mongooseConnect } = require('./config/plugin');
mongooseConnect();
console.log(dbConfig);
console.log(process.env.DB_PASSWORD); // 123456
console.log(appConfig); // 输出获取的 appConfig

// 引入模板引擎
const koaNunjucks = require('koa-nunjucks-2');
const path = require('path');

// 引入路由文件
const router = require('./app/router');

// 引入logger
const logger = require('./app/middleware/logger');

const app = new Koa(); // 创建koa 应用

// 使用模板引擎
app.use(koaNunjucks({
    ext: 'html',
    path: path.join(__dirname, 'app/view'),
    nunjucksConfig: {
        trimBlocks: true // 开启转义 防止Xss
    }
}));

app.use(logger()); // 处理log的中间件

// 使用中间件 处理404
app.use(async (ctx, next) => {
    await next(); // 调用next执行下一个中间件
    if (ctx.status === 404) {
        await ctx.render('404');
    }
});

// 使用koa-router中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(appConfig.port, appConfig.ip, () => {
    console.log(`服务已经启动，访问：http://localhost:${appConfig.port}${apiPrefix}`);
});
