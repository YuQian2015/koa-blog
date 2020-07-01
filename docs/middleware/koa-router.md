## Koa中间件使用之koa-router

[Koa-router](https://github.com/ZijianHe/koa-router) 是 koa 的一个路由中间件，它可以将请求的URL和方法（如：`GET` 、 `POST` 、 `PUT` 、 `DELETE` 等） 匹配到对应的响应程序或页面。本文将介绍 koa-router 基本配置、使用以及一些参考笔记。

### 基本配置

#### 创建Koa应用

下面的代码创建了一个koa web服务，监听了3000端口，如果访问 http://localhost:3000/ 将返回 `Not Found` ，这是因为代码没有对请求做任何响应。后面将使用 koa-router 在这个基础上进行修改，使其支持不同的路由匹配。

```js
// app.js

const Koa = require('koa'); // 引入koa

const app = new Koa(); // 创建koa应用

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})
```

#### 安装koa-router

```shell
$ npm install koa-router --save
```

#### 使用koa-router

首先，使用 `require()` 引入 `koa-router` ，并且对其实例化（支持传递参数），然后使用获取到的路由实例 `router` 设置一个路径，将 `'/'` 匹配到相应逻辑，返回一段HTML 。接着还需要分别调用  `router.routes()` 和 `router.allowedMethods()` 来得到两个中间件，并且调用 `app.use()` 使用这两个：

```js
const Koa = require('koa'); // 引入koa
const Router = require('koa-router'); // 引入koa-router

const app = new Koa(); // 创建koa应用
const router = new Router(); // 创建路由，支持传递参数

// 指定一个url匹配
router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = '<h1>hello world!</h1>';
})

// 调用router.routes()来组装匹配好的路由，返回一个合并好的中间件
// 调用router.allowedMethods()获得一个中间件，当发送了不符合的请求时，会返回 `405 Method Not Allowed` 或 `501 Not Implemented`
app.use(router.routes());
app.use(router.allowedMethods({ 
    // throw: true, // 抛出错误，代替设置响应头状态
    // notImplemented: () => '不支持当前请求所需要的功能',
    // methodNotAllowed: () => '不支持的请求方式'
}));

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})
```

### 使用

#### 不同请求方式

Koa-router 请求方法方式： `get` 、 `put` 、 `post` 、 `patch` 、 `delete` 、 `del`  ，而使用方法就是 `router.方式()`  ，比如 `router.get()` 和 `router.post()` 。而 `router.all()` 会匹配所有的请求方法。

当 URL 匹配成功，`router` 就会执行对应的中间件来对请求进行处理，下面是使用示例：

```js
// ...

// 指定一个url匹配
router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = '<h1>hello world!</h1>';
})
    .get("/users", async (ctx) => {
        ctx.body = '获取用户列表';
    })
    .get("/users/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `获取id为${id}的用户`;
    })
    .post("/users", async (ctx) => {
        ctx.body = `创建用户`;
    })
    .put("/users/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `修改id为${id}的用户`;
    })
    .del("/users/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `删除id为${id}的用户`;
    })
    .all("/users/:id", async (ctx) => {
        ctx.body = ctx.params;
    });

// ...
```

#### 从请求参数取值

有些时候需要从请求URL上获取特定参数，主要分为两类： `params` 和 `query` 。 这两种参数获取的方式如下：

**params参数**

```js
router.get('/:category/:title', (ctx, next) => {
  console.log(ctx.params);
  // => { category: 'programming', title: 'how-to-node' }
});
```

**query参数**

```js
router.get("/users", async (ctx) => {
	console.log('查询参数', ctx.query);
    ctx.body = '获取用户列表';
})
```

#### 路由使用中间件

`router` 还支持使用中间件，并且可以针对特定的URL或者多个URL使用中间件：

```js
// 先后设置两个中间件
router
  .use(session())
  .use(authorize());

// 给指定地址使用中间件
router.use('/users', userAuth());

// 给数组里面的地址使用中间件
router.use(['/users', '/admin'], userAuth());

app.use(router.routes());
```

#### 设置路由前缀

可以通过调用 `router.prefix(prefix)` 来设置路由的前缀，也可以通过实例化路由的时候传递参数设置路由的前缀，比如在 RESTful 接口里面，往往会为接口设置一个 `api` 前缀，如：

```js
router.prefix('/api')

// 或者
const router = new Router({
   prefix: '/api' 
})
```

当然也支持设置参数：

```js
router.prefix('/路径/:参数')
```

#### 路由嵌套

有时路由涉及到很多业务模块，可能需要对模块进行拆分和嵌套，koa-router 提供了路由嵌套的功能，使用也很简单，就是创建两个 `Router` 实例，然后将被嵌套的模块路由作为父级路由的中间件使用：

```js
var forums = new Router();
var posts = new Router();

posts.get('/', (ctx, next) => {...});
posts.get('/:pid', (ctx, next) => {...});
forums.use('/forums/:fid/posts', posts.routes(), posts.allowedMethods());

// responds to "/forums/123/posts" and "/forums/123/posts/123"
app.use(forums.routes());
```

#### 拆分路由

通过路由嵌套可以对路由进行拆分，不同的模块使用不同的文件，如下面的示例：

`app.js` 只引入路由入口文件

```diff
const Koa = require('koa'); // 引入koa
+ const router = require('./router');

const app = new Koa(); // 创建koa应用

+ app.use(router.routes());
+ app.use(router.allowedMethods());

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})
```

`router/user.js` 设置了 `user` 模块的路由，并且导出：

```js
const Router = require('koa-router');

const router = new Router();

router.get("/", async (ctx) => {
    console.log('查询参数', ctx.query);
    ctx.body = '获取用户列表';
})
    .get("/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `获取id为${id}的用户`;
    })
    .post("/", async (ctx) => {
        ctx.body = `创建用户`;
    })
    .put("/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `修改id为${id}的用户`;
    })
    .del("/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `删除id为${id}的用户`;
    })
    .all("/users/:id", async (ctx) => {
        ctx.body = ctx.params;
    });

module.exports = router;
```

`router/index.js` 导出了整个路由模块：

```js
const Router = require('koa-router');
const user = require('./user');

const router = new Router();

// 指定一个url匹配
router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = '<h1>hello world!</h1>';
})

router.use('/user', user.routes(), user.allowedMethods());

module.exports = router;
```

### 笔记

#### 命名路由

```js
router.get('user', '/users/:id', (ctx, next) => {
 // ...
});

router.url('user', 3);
// => "/users/3"
```

通过 `ctx._matchedRoute`  获得匹配的路由，通过 `ctx._matchedRouteName` 获得匹配的路由名。

#### 设置多个中间件

```js
router.get(
  '/users/:id',
  (ctx, next) => {
    return User.findOne(ctx.params.id).then(function(user) {
      ctx.user = user;
      next();
    });
  },
  ctx => {
    console.log(ctx.user);
    // => { id: 17, name: "Alex" }
  }
);
```

#### 路由重定向

使用 `router.redirect(source, destination, [code])` 可以对路由进行重定向，例子：

```js
router.redirect('/login', 'sign-in');
```

等价于：

```js
router.all('/login', ctx => {
  ctx.redirect('/sign-in');
  ctx.status = 301;
});
```

