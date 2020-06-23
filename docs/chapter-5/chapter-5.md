*在项目开发中，我们希望有多个环境配置，如开发环境、生产环境、测试环境等。不同的环境可能需要不同的配置，如数据库、日志、端口等。此外，不同的开发者也有不同的设置。*

经过前面的实战，我们已经有了下面的目录结构：

```
koa-blog
├── app
│   ├── middleware
│   │   └── logger.js
│   ├── router
│   │   ├── home.js
│   │   └── index.js
│   ├── util
│   │   └── log_format.js
│   └── view
│       ├── 404.html
│       └── index.html
├── app.js
├── config
│   └── config.js
└── package.json
```

为了让我们的项目支持不同的开发环境配置，我们将使用以下两个包：


- [config ](https://www.npmjs.com/package/config)  - 用来管理不同的运行环境
- [dotenv-safe](https://www.npmjs.com/package/dotenv-safe) - 用来定义一些需要保密的环境变量。

### 安装

```shell
$ npm install config dotenv-safe --save
```

### 配置运行环境

 [config ](https://www.npmjs.com/package/config) 会默认去查看项目根目录的 `config` 文件夹，所以我们需要创建一个 `config` 目录，这个在之前的实战已经做了。

接着，来创建一个默认的配置文件 `default.json` ，其中包含了我们的数据库设置以及服务的启动设置。以本项目为例，配置如下：

```js
// config/default.json

{
    "App": {
        "server": "0.0.0.0", // 所有ip可以访问
        "port": 3000 // 端口
    },
    "Router": {
        "apiPrefix": "/api" // 路由前缀
    },
    "Database": {
        "user": "moyufed", // MongoDB用户名
        "password": "123456", // MongoDB密码
        "host": "127.0.0.1",
        "dbName": "koaBlog", // MongoDB数据库名
        "port": 3001
    }
}
```

### 使用运行环境

在前面的代码中，我们配置了应用的设置 `App` 以及数据库连接配置 `Database`，在项目的任何地方需要使用这些配置时，我们只需要引用 `config` 就可以了，如：

```js
// app.js

const Koa = require('koa');
const config = require('config'); // 引入config
const appConfig = config.get('App'); // 直接使用 config 获取App的配置
const apiPrefix = config.get('Router.apiPrefix'); // 可以通过Router.apiPrefix获取具体的值
console.log(appConfig); // 输出获取的 appConfig

// ...

app.listen(appConfig.port, appConfig.ip, () => {
    console.log(`服务已经启动，访问：http://localhost:${appConfig.port}${apiPrefix}`);
});

```

在 `router` 里面也可以使用config：

```js
// app/router/index.js

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
router.use('/home', home.routes(), home.allowedMethods()); // 设置home的路由

module.exports = router;
```

当然，我们可以移除之前设置在 `config.js` 里面的路由前缀 `API_PREFIX` 。

```diff
// config.js

const CONFIG = {
-    "API_PREFIX": "/api", // 配置了路由前缀
    "LOG_CONFIG":
        {
        // ...
        }
};
module.exports = CONFIG;
```

启动服务之后，我们就能看到命令行能够打印出 `config.json` 里面的 App 配置信息：

```shell
{ server: '0.0.0.0', port: 3000 }
服务已经启动，访问：http://localhost:3000//api
```

### 配置多个环境

经过上面的介绍，我们已经通过 config 来配置运行环境了，但仅是这样我们并不能实现多个环境的配置，因此，现在我们来配置一个新的环境。

接下来，配置一个生产环境（production），我们需要在 `config` 目录新建一个 `production.json` 文件：

```js
// config/production.json

{
    "App": {
        "port": 8000
    }
}
```

我们并没有配置所有的变量，而是希望一些变量保持和默认配置一样，如服务启动的地址、数据库名称等等。

为了验证配置是否生效，我们来切换到production环境：

```shell
'export NODE_ENV=production' // Linux
'set NODE_ENV=production' // Windows
```

同样，为了方便，我们将该命令添加到 `package.json` 里面：

```json
{
  "name": "koa-blog",
  "scripts": {
    "start": "node app.js",
    "prod": "set NODE_ENV=production&&npm start"
  },
  // ...
}
```

接下来我们执行命令 `npm run prod` 启动服务就能够看到输出的环境配置已经改变，端口变成了 `8000` 。我们来访问 http://localhost:8000/api ，浏览器正常显示页面。

```shell
$ npm run prod

> set NODE_ENV=production&&npm start
> node app.js

{ ip: '0.0.0.0', port: 8000 }
服务已经启动，访问：http://localhost:8000/api
```

事实上，当我们调用 `config.get('App') ` 时，会从对应环境的 `json` 文件去取值替换 `default.json` 对应的值。若需要支持更多的运行环境，我们只需要新增其它的文件就行，如 `staging.json` 、 `qa.json`  等。

### 配置环境变量

大家已经注意到，在前面的配置中，我们的数据库密码是写在 `config` 里面的，我们不希望如此，为了安全起见，我们希望把密码配置在本地而不是提交到代码库或者仓库。因此，我们需要用到 [dotenv-safe](https://www.npmjs.com/package/dotenv-safe) 。

dotenv-safe  让我们可以定义私有的变量，这是 node 进程运行时的变量而不是前面配置的环境变量。dotenv-safe 默认会从项目根目录的 `.env` 文件中加载配置，下面我们开始来实战。

在根目录新建一个 `.env` 文件，内容如下：

```
DB_PASSWORD=123456
```

我们把数据库密码抽离了出来，并且我们会在 `.gitignore` 文件中忽略掉这个文件：

```diff
node_modules/
.idea/
logs/
+ .env
```

这样就不会提交到仓库了。

接下来我们新建一个 `.env.example` 文件用来提交到代码库，这个文件没有对变量进行赋值，但是能够表明项目使用的配置。并且，如果这个文件里面定义了 `.env` 没有的值，程序将停止执行。 `.env.example` 的内容：

```
DB_PASSWORD=
```

然后我们在 `app.js` 里面优先引入来进行使用：

```diff
+ require('dotenv-safe').config(); // 只需要引入一次
const Koa = require('koa');
const config = require('config'); // 引入config
const appConfig = config.get('App'); // 直接使用 config 获取App的配置
const apiPrefix = config.get('Router.apiPrefix'); // 可以通过Router.apiPrefix获取具体的值
+ console.log(process.env.DB_PASSWORD); // 123456
console.log(appConfig); // 输出获取的 appConfig

// ...
```

启动服务查看输出：

```
123456
{ ip: '0.0.0.0', port: 8000 }
服务已经启动，访问：http://localhost:8000/api
```

### 使用环境变量

接下来，我们将使用定义好的变量来替换 `config` 里面的配置。我们在 `config` 目录新增一个文件 `custom-environment-variables.json`：

```js
{
    "Database": {
        "password": "DB_PASSWORD"
    }
}
```

这个 `json` 文件里面我们对数据库的密码进行了定义，当我们执行 `config.get('Database.password')` 时， `config` 将去查询一个叫 “DB_PASSWORD” 的环境变量。如果查询不到就会使用匹配当前 node 环境的 json 文件的值，如果当前 node 环境的值任然没有设置，就会去查询 `default.json` 里面设置的默认值 。

我们再看修改 `app.js` 验证是否有效：

```diff
require('dotenv-safe').config(); // 只需要引入一次
const Koa = require('koa');
const config = require('config'); // 引入config
const appConfig = config.get('App'); // 直接使用 config 获取App的配置
const apiPrefix = config.get('Router.apiPrefix'); // 可以通过Router.apiPrefix获取具体的值
+ const dbConfig = config.get('Database');
+ console.log(dbConfig);
console.log(process.env.DB_PASSWORD); // 123456
console.log(appConfig); // 输出获取的 appConfig

// ...
```

我们修改 `.env` 里面的值来启动服务查看是否生效：

```
DB_PASSWORD=12345678
```

结果：

```shell
{ user: 'moyufed',
  password: '12345678',
  host: '127.0.0.1',
  dbName: 'koaBlog',
  port: 3001 }
12345678
{ ip: '0.0.0.0', port: 8000 }
服务已经启动，访问：http://localhost:8000/api
```

我们可以看到，数据库的连接密码已经被  `.env` 修改为 `12345678` 。通过这种方式，我们可以将服务器的一些配置抽离到 `.env` 文件：

```js
// .env
APP_IP=0.0.0.0
APP_PORT=3000
DB_PASSWORD=123456
DB_HOST=127.0.0.1
DB_PORT=3001
DB_USER=moyufed
DB_NAME=koaBlog

// config/custom-environment-variables.json
{
    "App": {
        "ip": "APP_IP", // 所有ip可以访问
        "port": "APP_PORT" // 端口
    },
    "Database": {
        "user": "DB_USER", // MongoDB用户名
        "password": "DB_PASSWORD", // MongoDB密码
        "host": "DB_HOST",
        "dbName": "DB_NAME", // MongoDB数据库名
        "port": "DB_PORT"
    }
}
```

**移除引入的旧的config设置**

参考资料：[Maintain Multiple Environment Configurations and Secrets in Node.js Apps](https://blog.stvmlbrn.com/2018/01/13/maintain-multiple-configurations-and-secrets-in-node-apps.html)



经过本节实战，我们已经完成了项目的环境配置，我们的项目目录如下：

```
koa-blog
├── .env.example
├── .env
├── .gitignore
├── app
│   ├── middleware
│   │   └── logger.js
│   ├── router
│   │   ├── home.js
│   │   └── index.js
│   ├── util
│   │   └── log_format.js
│   └── view
│       ├── 404.html
│       └── index.html
├── app.js
├── config
│   ├── config.js
│   ├── custom-environment-variables.json
│   ├── default.json
│   └── production.json
├── package.json
└── README.md
```

下一步，我们来使用 MongoDB …