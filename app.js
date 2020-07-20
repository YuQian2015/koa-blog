// app.js

require('dotenv-safe').config(); // 只需要引入一次
const Koa = require('koa');
const config = require('config'); // 引入config
const appConfig = config.get('App'); // 直接使用 config 获取App的配置
const apiPrefix = config.get('Router.apiPrefix'); // 可以通过Router.apiPrefix获取具体的值
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors'); // 引入 koa-cors 中间件
const { mongooseConnect } = require('./config/plugin');
mongooseConnect();

// 引入模板引擎
const koaNunjucks = require('koa-nunjucks-2');
const path = require('path');

// 引入路由文件
const router = require('./app/router');

// 引入logger
const logger = require('./app/middleware/logger');
const responseHandler = require('./app/middleware/response_handler');

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
app.use(cors()); // 启用cors， 支持传递配置
app.use(bodyParser()); // 使用bodyParser中间件，可以从post请求获取请求体
app.use(responseHandler()); // 处理响应的中间件

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
