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

日志对于 Web 后台应用来说是必要的，Koa 原生并不支持支持日志模块，所幸 GitHub 已经有很多优秀的 Node.js 日志框架，这节实战将使用  [log4js-node](https://github.com/log4js-node/log4js-node) 来处理 Koa 的日志，当然也有像 [koa-log4](https://github.com/dominhhai/koa-log4js) 这样的 Koa 中间件对 log4js-node 进行了封装，本节实战也会实现一个中间件来处理日志。

### log4js-node的基本使用

log4js-node 是经过对 [log4js](https://github.com/stritti/log4js) 框架进行转换来支持 node 的，在开始实战之前，先耐心来看下 log4js 的基本使用方式：

```javascript
const log4js = require("log4js"); // 引入 log4js
const logger = log4js.getLogger(); // 获得 default category 
logger.level = "debug"; // 设置 level
logger.debug("调试信息"); // 输出日志

// 输出： [2020-10-31T16:02:24.527] [DEBUG] default - 调试信息
```

默认的情况下，`default` 类别（category ）的日志 `level` 是设置为 `OFF` 的，上面的代码将其设置为 "debug"，这使得调试信息可以输出到 stdout。

再来看一个示例：

```javascript
const log4js = require("log4js");
// 对日志进行配置
log4js.configure({
    // 指定输出文件类型和文件名
    appenders: { cheese: { type: "file", filename: "cheese.log" } }, 
    // appenders 指定了日志追加到 cheese
    // level 设置为 error
    categories: { default: { appenders: ["cheese"], level: "error" } } 
});

const logger = log4js.getLogger(); // 获取到 default 分类
logger.trace("Entering cheese testing");
logger.debug("Got cheese.");
logger.info("Cheese is Comté.");
logger.warn("Cheese is quite smelly.");
logger.error("Cheese is too ripe!"); // 从这里开始写入日志文件
logger.fatal("Cheese was breeding ground for listeria.");
```

从上面的设置看到 `appenders` 指定了日志追加到 `cheese`（也就是cheese.log）里面去，`level` 设置为 `"error"`，也就是说只有日志等级大于 `"error"` 的才会添加到 log 文件。

当执行了上面的代码，可以看到项目目录里面多了一个 cheese.log 文件，内如如下：

```
[2020-10-31T16:26:17.188] [ERROR] default - Cheese is too ripe!
[2020-10-31T16:26:17.194] [FATAL] default - Cheese was breeding ground for listeria.
```

有关 [ log4js-node](https://github.com/log4js-node/log4js-node) 的更多使用示例可以参考 [example.js](https://github.com/log4js-node/log4js-node/blob/master/examples/example.js) 以及 [examples](https://github.com/log4js-node/log4js-node/tree/master/examples) 目录下的文件。

下面来进入本节的实战…

### 安装 log4js

前面对 log4js-node 进行了简单介绍，现在来在应用里面使用，首先安装 log4js：

```shell
$ npm install log4js --save
```

### 设置 log4js

我们修改 `config/config.js` ，来对 log4js 编写一些配置：

```javascript
// config/config.js

const CONFIG = {
    "API_PREFIX": "/api", // 配置了路由前缀
    "LOG_CONFIG":
        {
            "appenders": {
                "error": {
                    "category": "errorLogger",      // logger 名称
                    "type": "dateFile",             // 日志类型为 dateFile
                    "filename": "logs/error/error", // 日志输出位置
                    "alwaysIncludePattern": true,   // 是否总是有后缀名
                    "pattern": "yyyy-MM-dd-hh.log"  // 后缀，每小时创建一个新的日志文件
                },
                "response": {
                    "category": "resLogger",
                    "type": "dateFile",
                    "filename": "logs/response/response",
                    "alwaysIncludePattern": true,
                    "pattern": "yyyy-MM-dd-hh.log"
                }
            },
            "categories": {
                "error": {
                    "appenders": ["error"],         // 指定日志被追加到 error 的 appenders 里面
                    "level": "error"                // 等级大于 error 的日志才会写入
                },
                "response": {
                    "appenders": ["response"],
                    "level": "info"
                },
                "default": {
                    "appenders": ["response"],
                    "level": "info"
                }
            }
        }
};
module.exports = CONFIG;
```

写好了配置，接下来就是使用配置，先来看一下使用的代码示例：

```javascript
const log4js = require("log4js");
const CONFIG = require('./config/config');
// 对日志进行配置
log4js.configure(CONFIG);

// 分别获取到 categories 里面的 error 和 response 元素
// 目的是为了输出错误日志和响应日志
const errorLogger = log4js.getLogger('error'); 
const resLogger = log4js.getLogger('response');

// 输出日志
errorLogger.error('错误日志');
resLogger.info('响应日志');
```

运行完成之后，可以在 log 目录查看到对应的日志文件，里面的内容分别如下：

错误日志

```
[2020-10-31T17:12:37.263] [ERROR] error - 错误日志
```

响应日志

```
[2020-10-31T17:12:37.265] [INFO] response - 响应日志
```

到这里一切正常工作，接下来就要将 Koa 应用的每次请求响应、报错等信息以一定的格式存入日志，我们自然想到**日志格式**和**中间件**，下面逐一来看怎么实现。

### 日志格式

我们关心用户请求的信息有哪些？这里列出本节关注的日志内容，包括**访问方法**、**请求原始地址**、**客户端 IP**、**响应状态码**、*响应内容*、**错误名称**、**错误信息**、**错误详情**、**服务器响应时间**。

为了使请求产生的 log 方便查看，新增一个文件 `app/util/log_format.js` 来统一格式：

```js
// app/util/log_format.js

const log4js = require('log4js');

const { LOG_CONFIG } = require('../../config/config'); //加载配置文件
log4js.configure(LOG_CONFIG);

let logFormat = {};

// 分别获取到 categories 里面的 error 和 response 元素
// 目的是为了输出错误日志和响应日志
let errorLogger = log4js.getLogger('error');
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

这段 JavaScript 最终返回了一个 `logFormat` 对象的工具，提供了 `response`  和 `error` 记录前面提到的必要信息，接下来就需要在中间件里面去使用。

### logger 中间件

有了 log4js 的配置并且统一格式之后，我们需要将它们都做进一个中间件中，这样才能对每次请求和响应生效，下面来创建一个中间件 `logger` ：

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

```diff
// ...

// 引入logger
+ const logger = require('./app/middleware/logger');

// 使用模板引擎
// ...

+ app.use(logger()); // 处理log的中间件

// ...

app.listen(3000, () => {
    console.log('App started on http://localhost:3000/api')
});
```

都设置好了之后，执行 `npm start` ，当启动成功之后，我们看到项目多了一个目录 `logs` ，里面有两个文件，分别是报错日志和响应日志。在浏览器中访问 http://localhost:3000/api  ，可以看到响应日志里面添加了刚刚的访问记录。

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