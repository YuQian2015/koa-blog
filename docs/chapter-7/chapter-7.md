*我们使用 RESTful 的风格设计一个接口，方便前后端进行通信，实现前后端分离。*

在开始实战之前，先来了解一下 RESTful API 。

### RESTful API 设计

#### 域名相关

理论上应该将 API 部署在专门的域名如： `https://api.example.com` ，但由于目前 API 很简单，在不考虑进一步扩展 API 的情况下，这里准备放在 `https://example.org/api/` 下面，因此在前面的实战中，已经为路由增加 `/api` 前缀。

#### 版本

需要使用到版本的时候，将 API 的版本号放入URL，比如： `https://example.com/api/v1/` 。

#### 访问路径

在设计访问路径时将不同的资源归属到不同的路径，由于资源都是存在数据库中的集合，这里使用复数名词来结尾，如：

```
https://example.com/api/v1/articles
https://example.com/api/v1/tags
```

#### 请求方式

常用到的HTTP请求方式和对应的功能：

- GET：获取数据
- POST：创建数据
- PUT：更新完整数据
- PATCH：更新数据（提供改变的属性）
- DELETE：删除数据

不常用的请求方式还有 `HEAD` 和 `OPTIONS` 。

#### 设计API

**请求类型和路径代表的功能**

以文章接口 `articles` 为例：

| 类型   | 地址                        | 描述                         | 返回内容     |
| ------ | --------------------------- | ---------------------------- | ------------ |
| GET    | `/api/v1/articles`          | 用来获取文章列表             | 文章列表数组 |
| POST   | `/api/v1/articles`          | 用来新建文章                 | 文章详情     |
| GET    | `/api/v1/articles/:id`      | 用来获取某一篇文章的详细信息 | 文章详情     |
| PUT    | `/api/v1/articles/:id`      | 用来更新某一篇文章的全部信息 | 文章详情     |
| PATCH  | `/api/v1/articles/:id`      | 用来更新某一篇文章的部分信息 | 文章详情     |
| DELETE | `/api/v1/articles/:id`      | 删除某一篇文章               | 空对象       |
| GET    | `/api/v1/articles/:id/tags` | 获取某一篇文章的标签列表     | 标签列表     |

**常见参数**

- ?limit=10：指定返回记录的数量
- ?offset=10：指定返回记录的开始位置。
- ?page=2&per_page=100：指定第几页，以及每页的记录数。
- ?sortby=name&order=asc：指定返回结果按照哪个属性排序，以及排序顺序。
- ?animal_type_id=1：指定筛选条件

### 状态码

服务器向用户返回的状态码和提示信息，常见的有以下一些（方括号中是该状态码对应的HTTP动词）：

- 200 OK - [GET]：服务器成功返回用户请求的数据，该操作是幂等的（Idempotent）。
- 201 CREATED - [POST/PUT/PATCH]：用户新建或修改数据成功。
- 202 Accepted - [*]：表示一个请求已经进入后台排队（异步任务）
- 204 NO CONTENT - [DELETE]：用户删除数据成功。
- 400 INVALID REQUEST - [POST/PUT/PATCH]：用户发出的请求有错误，服务器没有进行新建或修改数据的操作，该操作是幂等的。
- 401 Unauthorized - [*]：表示用户没有权限（令牌、用户名、密码错误）。
- 403 Forbidden - [*] 表示用户得到授权（与401错误相对），但是访问是被禁止的。
- 404 NOT FOUND - [*]：用户发出的请求针对的是不存在的记录，服务器没有进行操作，该操作是幂等的。
- 406 Not Acceptable - [GET]：用户请求的格式不可得（比如用户请求JSON格式，但是只有XML格式）。
- 410 Gone -[GET]：用户请求的资源被永久删除，且不会再得到的。
- 422 Unprocesable entity - [POST/PUT/PATCH] 当创建一个对象时，发生一个验证错误。
- 500 INTERNAL SERVER ERROR - [*]：服务器发生错误，用户将无法判断发出的请求是否成功。

> 来自 [阮一峰的网络日志-RESTful API 设计指南](http://www.ruanyifeng.com/blog/2014/05/restful_api.html) 。

#### 响应数据和错误处理

这里推荐使用 JSON 作为响应数据，主要结构如下：

```json
{
    "success": true,
    "message": "",
    "data": {},
    "code": 200
}
```

当请求处理成功时，`success` 为 `true` ，如果状态码是 `4xx`，应向用户返回出错信息，为了前端可以统一处理响应，这里可以返回如下：

```json
{
    "success": false,
    "message": "错误信息",
    "data": {},
    "code": "状态码"
}
```

经过简单介绍，现在开始来进行实战。

### 使用中间件统一响应格式

先来新增一个中间件 `app/middleware/response_handler.js` ，在里面导出一个用于格式化响应的方法：

```js
// app/middleware/response_handler.js

module.exports = () => {
    // 导出一个方法
    return async (ctx, next) => {
        // 为ctx增加一个setResponse函数用于设置响应
        ctx['setResponse'] = async ({ data = {}, code = 200 }) => {
            ctx.type = 'json';
            if (code === 200) {
                ctx.body = {
                    success: true,
                    message: "",
                    data,
                    code,
                };
            }
        };
        await next();
    };
};
```

可以看到当在使用该中间件时，会自动给上下文 `ctx` 添加一个 `function` ，因此在需要响应数据的地方调用 `ctx.setResponse()` 就可以实现 JSON 数据响应。下面来看看如何使用：

```diff
// app.js

// ...

// 引入logger
const logger = require('./app/middleware/logger');
+ const responseHandler = require('./app/middleware/response_handler');

// ...

app.use(logger()); // 处理log的中间件
+ app.use(responseHandler()); // 处理响应的中间件

// ...
```

在需要进行响应的地方调用，比如将之前写的创建文章接口进行修改

```diff
// app/controller/article.js

const { article } = require("../service"); // 引入service

class ArticleController {
  async create(ctx) {
    try {
      const newArticle = await article.create({
        title: "第一条数据",
        content: "从零开始的koa实战",
        summary: "实战"
      });
+       ctx.setResponse({ data: newArticle });
-       ctx.body = newArticle;
    } catch (err) {
      ctx.body = err;
      throw new Error(err);
    }
  }
}

module.exports = new ArticleController();
```

重启服务之后，再次访问 http://localhost:3000/api/article ，可以得到如下结果

```json
{"success":true,"message":"","data":{"status":1,"_id":"5f0d84f85064d0234406383e","title":"第一条数据","content":"从零开始的koa实战","summary":"实战","createDate":"2020-07-14T10:12:08.875Z","updateDate":"2020-07-14T10:12:08.875Z","__v":0},"code":200}
```

正好是需要的响应格式。

在 utils 目录新建 response.js ，在 config 目录新建 errorCode.json。

utils/response.js

```js
const errorCode = require('./errorCode');
// 对响应数据进行规范，如果传递的对象有errorCode，返回报错信息
module.exports = (response) => {
  const {errorCode, data, msg} = response;
  if (errorCode) {
    return {
      "error": true,
      "msg": msg
        ? msg
        : errorCode[response.errorCode],
      "data": {},
      "errorCode": errorCode
    }
  }
  if (data) {
    return {
      "error": false,
      "msg": msg
        ? msg
        : "",
      "data": data,
      "errorCode": ""
    }
  }
};

```

config/errorCode.json

```js
{
    "000":"系统错误，请联系管理员。",
    "001":"请先登录账户登录。",
    "002":"该邮箱已经注册过，请更换邮箱。",
    "003":"用户登录验证失败，请尝试重新登录。",
    // 省略
}
```

### 注册接口

为了实现用户注册，我们需要新增一个用户的集合，这里创建 `user` 模型，在 `app/model` 目录下新增一个 `user.js` ：

```js
// app/model/user.js

// 引入 Mongoose
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
    uid: { // 用户ID
        type: String,
        required: true
    },
    email: String, // 用户邮箱
    password: String, // 用户密码
    name: String,
    avatarUrl: String,  // 用户头像
    sex: {
        type: Number,
        default: 0
    }, // 性别 0未设置 1男 2女
}, {
    timestamps: { // 使用时间戳
        createdAt: 'createDate', // 将创建时间映射到createDate
        updatedAt: 'updateDate' // 将修改时间映射到updateDate
    }
});

module.exports = mongoose.model('User', UserSchema);
```

mongoose 对 `Schema` 的定义可以设置类型、验证条件、是否必填等，定义好 model 之后，可以在 `service` 里面用来操作集合。

因此再去新建对应的 service ，根据前面的实战，这里代码如下：

```js
// app/service/user.js

const userModel = require('../model/user');
const Service = require('./base');

class UserService extends Service {
    constructor() {
        super(userModel)
    }
    // ...
}

module.exports = new UserService();



// app/service/index.js

const article = require('./article');
const user = require('./user');

module.exports = {
    article, user
};
```

接下来就需要将在 `controller` 中将方法指定到 `service` 的用户创建逻辑，比如：

```js
// app/controller/user.js

const { user } = require("../service"); // 引入service

class UserController {
  async create(ctx) {
    try {
      const { email, password, name } = ctx.body;
      const newUser = await user.create({
        email, password, name
      });
      ctx.setResponse({ data: newUser });
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }
}

module.exports = new UserController();



// app/controller/index.js

const article = require('./article');
const user = require('./user');

module.exports = {
  article, user,
};
```

由于需要获取 `POST` 请求`body` 里面的 JSON 数据，还需要用到 [koa-bodyparser](https://github.com/koajs/bodyparser) ，koa-bodyparser 支持 `json`, `form` 和 `text` 类型的 body 数据。安装 koa-bodyparser：

```shell
$ npm install koa-bodyparser --save
```

使用：

```js
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
// ...
app.use(logger());
app.use(bodyParser());
// ...
```

为了便于逻辑控制，我们将注册用户的操作放到单独的文件中进行，新增目录 controllers ，并在其中新增 index.js 文件和 user.js 文件。

controllers/user.js

```js
……
const response = require('../utils/response');

class UserController {
  constructor() {}
  // 定义一个一部函数register用来注册用户，接收请求传过来的body
  async register(reqBody) {
    let dataArr = { // 展开运算，并添加创建时间
      ...reqBody,
      createDate: new Date()
    }
    try {
      let list = await user.find({email: dataArr.email}); // 先查询是否存在该用户
      let respon = {};
      if (list && list.length > 0) {
        respon = response({errorCode: '002'});
      } else {
        let newUser = await user.create(dataArr); // 如果没有注册过就进行注册
        respon = response({data: newUser});
      }
      return respon;
    } catch (err) {
      console.log(err)
      throw new Error(err);
      return err;
    }
  }
}

const userController = new UserController();

module.exports = userController;
```

我们也新建一个 controllers/index.js 来引入要用的 controller：

```js
const user = require('./user');

module.exports = {
  user
};

```

接下来需要在路由定义一个请求接口了，我们将之前的 routes\users.js 进行以下修改：

```js
const router = require('koa-router')();
const {user} = require('../controllers');

router.get('/', (ctx, next) => {
  ctx.response.body = 'users';
});

// 新增一个post路由，用来接收post请求
router.post('/register', async (ctx, next) => {
  // 接收客户端请求传递的数据
  let reqBody = ctx.request.body;
  console.log(ctx.request.body);
  ctx.body = await user.register(reqBody);
});

module.exports = router;

```

这样就定义了一个 RESTful API 了，为了验证能够调用成功，我们使用 postman 来进行调试。

### postman-调用接口

安装postman，打开并进行注册，这里不进行描述。打开postman，新增配置一个接口调用，如下图：

![01](01.jpg)

点击send，我们就可以发送一个post请求了，我们采用JSON格式传递数据。通过上面的操作我们看到 postman 里面产生响应数据，但是并没有我没新建的用户信息，我们再查看数据库集合里面多了一个文档，但是缺少了用户信息。

![02](02.jpg)



> 描述 补充

造成这个结果的原因是我们采用 JSON 类型来传递请求数据，context 里面获取的请求 body 为 undefined。为了让 koa 能够支持 JSON 类型的 body 数据，我们 [koa-bodyparser](https://github.com/koajs/bodyparser) 来处理,，koa-bodyparser 支持 `json`, `form` and `text` 类型的 body 。

安装：

```shell
npm install koa-bodyparser
```

在 app.js 使用这个中间件：

```js
const Koa = require('koa');
const app = new Koa();

……
const bodyParser = require('koa-bodyparser');


……
app.use(logger());
app.use(bodyParser());
app.use(routes.routes()).use(routes.allowedMethods());
……
```

重启服务之后，我们再次点击发送。

![03](03.jpg)

### 跨域访问

通过上面的实例，我们已经能够经过 postman 请求接口并存入数据了。为了验证接口是否能够在前端项目里面调用，我们将在前端页面中去请求这个接口。前端项目地址：待补充

在启动页面之后我们输入对应的数据，点击注册。我们发现浏览器的 console 里面报了一个错误。

Failed to load http://localhost:3000/v1/users/register: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://localhost:8080' is therefore not allowed access.

这正是因为我们的接口没有允许跨域访问请求导致的。

![04](04.jpg)

> 描述 补充

为了解决这个问题，我们使用 [koa-cors](https://www.npmjs.com/package/koa-cors) 中间件来处理跨域请求。

```shell
npm install koa-cors
```

app.js

```js
……
const cors = require('koa-cors');

……
app.use(logger());
app.use(cors());
app.use(bodyParser());
……

```

重启服务之后我们再次点击注册。

![05](05.jpg)

成功，我们已经能在前端项目调用注册接口来注册用户了。
