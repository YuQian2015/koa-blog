*日志让我们能够监控应用的运行状态、问题排查等。*

经过上一节的实战，我们已经有了下面的目录结构：

```
koa-blog
├── package.json
├── app.js
├── app
│   ├── router
│   |   ├── homde.js
│   |   └── index.js
│   └── view
│       ├── 404.html
│       └── index.html
└── config
    └── config.js
```

### 安装

我们使用 [log4js-node](https://github.com/log4js-node/log4js-node) 来记录日志：

```shell
$ npm install log4js --save
```

### 设置

我们来修改 `config.js` ，对 log4js 进行一些设置：

```json
// config/config.js

const CONFIG = {
    "API_PREFIX": "/api", // 配置了路由前缀
    "LOG_CONFIG":
        {
            "appenders": {
                error: {
                    "category": "errorLogger", //logger名称
                    "type": "dateFile", //日志类型
                    "filename": 'logs/error/error', //日志输出位置
                    "alwaysIncludePattern": true, //是否总是有后缀名
                    "pattern": "-yyyy-MM-dd-hh.log" //后缀，每小时创建一个新的日志文件
                },
                response: {
                    "category": "resLogger",
                    "type": "dateFile",
                    "filename": 'logs/response/response',
                    "alwaysIncludePattern": true,
                    "pattern": "-yyyy-MM-dd-hh.log"
                }
            },
            "categories": {
                error: {
                    appenders: ['error'],
                    level: 'error'
                },
                response: {
                    appenders: ['response'],
                    level: 'info'
                },
                default: {
                    appenders: ['response'],
                    level: 'info'
                }
            }
        }
};
module.exports = CONFIG;
```

### 日志格式

为了使请求产生的 log 方便查看，我们新增一个文件来处理格式统一：

```js
// app/util/log_format.js

const log4js = require('log4js');

const { LOG_CONFIG } = require('../../config/config'); //加载配置文件
log4js.configure(LOG_CONFIG);

let logFormat = {};

let errorLogger = log4js.getLogger('error'); // categories的元素
let resLogger = log4js.getLogger('response');

//封装错误日志
logFormat.error = (ctx, error, resTime) => {
    if (ctx && error) {
        errorLogger.error(formatError(ctx, error, resTime));
    }
};

//封装响应日志
logFormat.response = (ctx, resTime) => {
    if (ctx) {
        resLogger.info(formatRes(ctx, resTime));
    }
};

//格式化响应日志
const formatRes = (ctx, resTime) => {
    let responserLog = formatReqLog(ctx.request, resTime); // 添加请求日志
    responserLog.push(`response status: ${ctx.status}`); // 响应状态码
    responserLog.push(`response body: \n${JSON.stringify(ctx.body)}`); // 响应内容
    responserLog.push(`------------------------ end\n`); // 响应日志结束
    return responserLog.join("\n");
};

//格式化错误日志
const formatError = (ctx, err, resTime) => {
    let errorLog = formatReqLog(ctx.request, resTime); // 添加请求日志
    errorLog.push(`err name: ${err.name}`); // 错误名称
    errorLog.push(`err message: ${err.message}`); // 错误信息
    errorLog.push(`err stack: ${err.stack}`); // 错误详情
    errorLog.push(`------------------------ end\n`); // 错误信息结束
    return errorLog.join("\n");
};

// 格式化请求日志
const formatReqLog = (req, resTime) => {
    let method = req.method;
    // 访问方法 请求原始地址 客户端ip
    let formatLog = [`\n------------------------ ${method} ${req.originalUrl}`, `request client ip: ${req.ip}`];

    if (method === 'GET') { // 请求参数
        formatLog.push(`request query: ${JSON.stringify(req.query)}\n`)
    } else {
        formatLog.push(`request body: ${JSON.stringify(req.body)}\n`)
    }

    formatLog.push(`response time: ${resTime}`); // 服务器响应时间
    return formatLog;
};

module.exports = logFormat;
```

### logger 中间件

有了 log4js 的配置和统一格式之后，我们需要将它们都做进一个中间件中，下面来创建一个中间件 `logger` ：

```js
// app/middleware/logger.js

const logFormat = require('../util/log_format');

const logger = () => {
    return async (ctx, next) => {
        const start = new Date(); //开始时间
        let ms; //间隔时间
        try {
            await next(); // 下一个中间件
            ms = new Date() - start;
            logFormat.response(ctx, `${ms}ms`); //记录响应日志
        } catch (error) {
            ms = new Date() - start;
            logFormat.error(ctx, error, `${ms}ms`); //记录异常日志
        }
    }
};

module.exports = logger;
```

中间件 `logger` 已经建立好，下面来使用这个中间件：

```js
// ...

// 引入logger
const logger = require('./app/middleware/logger');

// 使用模板引擎
app.use(koaNunjucks({
    ext: 'html',
    path: path.join(__dirname, 'app/view'),
    nunjucksConfig: {
        trimBlocks: true // 开启转义 防止Xss
    }
}));

app.use(logger()); // 处理log的中间件

// ...

app.listen(3000, () => {
    console.log('App started on http://localhost:3000/api')
});
```

都设置好了之后，执行 `npm start` ，当启动成功之后，我们看到项目多了一个目录 `logs` ，里面有两个文件，分别是报错日志和响应日志。在浏览器中访问 http://localhost:3000/v1  ，可以看到响应日志里面添加了刚刚的访问记录。

完成这一节实战之后，整个文件目录如下：

```
koa-blog
├── package.json
├── app.js
├── app
│   ├── middleware
│   |   └── logger.js
│   ├── router
│   |   ├── homde.js
│   |   └── index.js
│   ├── util
│   |   └── log_format.js
│   └── view
│       ├── 404.html
│       └── index.html
├── logs
│   ├── error
│   └── response
└── config
    └── config.js

```

*当然，我们不需要将 `logs` 目录提交到 git 仓库，我们可以在 `.gitignore` 文件中将其忽略。*

下一步，我们来了解 MongoDB … 