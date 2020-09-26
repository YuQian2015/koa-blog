// app.js

require('dotenv-safe').config(); // 只需要引入一次
const Koa = require('koa');
const config = require('config'); // 引入config
const appConfig = config.get('App'); // 直接使用 config 获取App的配置
const apiPrefix = config.get('Router.apiPrefix'); // 可以通过Router.apiPrefix获取具体的值
const dbConfig = config.get('Database');
const bodyParser = require('koa-bodyparser');
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
    nunjucksConfig: { // 这里是nunjucks的配置
        /*
         *   autoescape (默认值: true) 控制输出是否被转义，查看 Autoescaping
         *   throwOnUndefined (default: false) 当输出为 null 或 undefined 会抛出异常
         *   trimBlocks (default: false) 自动去除 block/tag 后面的换行符
         *   lstripBlocks (default: false) 自动去除 block/tag 签名的空格
         *   watch (默认值: false) 当模板变化时重新加载。使用前请确保已安装可选依赖 chokidar。
         *   noCache (default: false) 不使用缓存，每次都重新编译
         * 	 web 浏览器模块的配置项
         *   	useCache (default: false) 是否使用缓存，否则会重新请求下载模板
         *   	async (default: false) 是否使用 ajax 异步下载模板
         * 	 express 传入 express 实例初始化模板设置
         * 	 tags: (默认值: see nunjucks syntax) 定义模板语法，查看 Customizing Syntax
         */
        trimBlocks: true
    }
}));

app.use(logger()); // 处理log的中间件
app.use(bodyParser());
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
