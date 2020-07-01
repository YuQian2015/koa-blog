## 从零开始的Koa实战

### 实战目的

- 使用 Koa2 实现一个博客系统，支持内容发布、图片上传、文件导出/下载等，最终发布。

- 对以往做的实战内容进行查漏补缺，温故知新。

- 如果时间允许，会使用 Egg 进行重构。

### 技术和要点

- 后端使用 Koa2 及其中间件、数据库使用 MongoDB、 前端使用 React+Redux+UI框架待定。

- 要点：RESTful API、 JWT、 自动生成API文档、混合加密传输、访问权限控制、PM2等。

### 实战章节

- 第一章 [初识Koa](./docs/chapter-1/chapter-1.md)
- 第二章 [路由](./docs/chapter-2/chapter-2.md)
- 第三章 [日志](./docs/chapter-3/chapter-3.md)
- 第四章 [MongoDB](./docs/chapter-4/chapter-4.md)
- 第五章 [环境配置](./docs/chapter-5/chapter-5.md)
- 第六章 [插入数据](./docs/chapter-6/chapter-6.md)

### 中间件使用

- [Koa中间件使用之koa-router](./docs/middleware/koa-router.md)

### 基础知识

#### 什么是koa

Koa 基于 Node.js 平台的下一代 Web 开发框架，由 Express 原班人马打造的，致力于成为一个更小、更富有表现力、更健壮的 Web 框架。和 Express 不同，使用 Koa 编写 web 应用，通过组合不同的 generator，可以免除重复繁琐的回调函数嵌套，并极大地提升错误处理的效率。

阿里基于 Koa 开发了 Egg.js 企业级框架，在 Koa 的模型基础上，进一步对它进行了一些增强，可以帮助开发团队和开发人员降低开发和维护成本。

#### 异步编程模型

Node.js 是以回调函数（callback）形式进行的异步编程模型，这会带来许多问题，例如：回调函数嵌套，同步调用回调等。

为了解决异步编程的问题，可以采用 Promise（ES2015）、Generator、Async/Await（ES2017） 等方案。

#### Async function

[Async function](https://github.com/tc39/ecmascript-asyncawait) 是一个语法糖，在 async function 中，我们可以通过 `await` 关键字来等待一个 Promise 被 resolve（或者 reject，此时会抛出异常）， Node.js 在 8.x 的 LTS 版本开始原生支持。

```js
const fn = async function() {
  const user = await getUser();
  const posts = await fetchPosts(user.id);
  return { user, posts };
};
fn().then(res => console.log(res)).catch(err => console.error(err.stack));
```

#### Koa 的 `app.listen()` 做了什么？

先看一下 koa 的 `application.js` 文件里面的源代码：

```js
/**
   * Shorthand for:
   *
   *    http.createServer(app.callback()).listen(...)
   *
   * @param {Mixed} ...
   * @return {Server}
   * @api public
   */

  listen(...args) {
    debug('listen');
    const server = http.createServer(this.callback()); // 这里传入了koa的 callback()
    return server.listen(...args);
  }
```

在上面的代码中可以看到， `app.listen(…)` 实际上是`http.createServer(app.callback()).listen(…)` 方法的语法糖。调用 `app.listen()` 实际上就是去调用 node.js 的 http 模块来创建服务，并且创建成功之后会回调 app 的 `callback` 。

#### Koa 的 `callback` 做了什么？

从上面的代码中，我们看到在创建服务时，koa 使用了`this.callback()` ，这个 `callback` 具体做了什么呢？我们先来看源码：

```js
const compose = require('koa-compose');
// ...

  /**
   * Return a request handler callback
   * for node's native http server.
   *
   * @return {Function}
   * @api public
   */

  callback() {
    const fn = compose(this.middleware);// 合并this.middleware里面的中间件

    if (!this.listenerCount('error')) this.on('error', this.onerror);

    const handleRequest = (req, res) => {// 这里接收了node.js的原生请求和响应
      const ctx = this.createContext(req, res); // 在这里创建了上下文
      return this.handleRequest(ctx, fn); // 把上下文交由 handleRequest 处理
    };

    return handleRequest;
  }
```

首先是使用 `compose` 将应用的中间件 `this.middleware` 进行了合并，`this.middleware` 是一个数组，当我们调用 `app.use(function)` 来使用中间件的时候，会将中间件方法 `push` 到这个数据里面。

然后返回一个方法 `handleRequest` 来处理 node 的 http 请求。在 `handleRequest` 中接收请求时，不仅创建了上下文 `ctx` ，而且还调用了应用本身的 `handleRequest` 函数来处理请求。这其中有几个我们需要关心的东西：

- `compose` —— `koa-compose` 中间件，用来对中间件进行合并
- `createContext` —— 用来创建上下文
- `handleRequest`——用来处理请求

后面会对其进行介绍。

#### 什么是中间件

Koa 中间件是一个函数，是接收到请求到处理逻辑之间、处理逻辑到发送响应之间执行的一逻辑：

```
客户端请求到服务端-->中间件1-->中间件2-->服务端业务代码-->中间件2-->中间件1-->服务端响应到客户端
```

#### 怎么使用中间件

Koa 的 `app.use(function)` 方法可以使用中间件，首先需要知道中间件是一个 `function` ，如：

```js
app.use(async (ctx, next) => { // 中间件是一个function，可以接收两个参数：ctx和next
  const start = Date.now(); // 请求阶段执行的逻辑
  await next(); // 将请求的执行逻辑跳转到下一个中间件
  const ms = Date.now() - start; // 响应阶段执行的逻辑
  ctx.set('X-Response-Time', `${ms}ms`);
});
```

#### 中间件使用示例

下面是来自Koa的例子，在页面中返回 "Hello World"，然而当请求开始时，请求先经过 `x-response-time` 和 `logging` 中间件，并记录中间件执行起始时间。 然后将控制权交给 reponse 中间件。当一个中间件调用`next()`函数时，函数挂起并控件传递给定义的下一个中间件。在没有更多的中间件执行下游之后，堆栈将退出，并且每个中间件被恢复以执行其上游行为。

```js
const Koa = require('koa');
const app = new Koa();

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// logger

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}`);
});

// response

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
```

#### 中间件级联

中间件类似于一个过滤器，在客户端和应用程序之间处理请求和响应。

```js
.middleware1 {
  // (1) do some stuff
  .middleware2 {
    // (2) do some other stuff
    .middleware3 {
      // (3) NO next yield !
      // this.body = 'hello world'
    }
    // (4) do some other stuff later
  }
  // (5) do some stuff lastest and return
}
```

中间件的执行很像一个洋葱，但并不是一层一层的执行，而是以next为分界，先执行本层中next以前的部分，当下一层中间件执行完后，再执行本层next以后的部分。

[![koa-middleware](https://github.com/YuQian2015/koa-learning/raw/master/document/note-1/koa-middleware.png)](https://github.com/YuQian2015/koa-learning/blob/master/document/note-1/koa-middleware.png)

```js
let koa = require('koa');
let app = new koa();

app.use((ctx, next) => {
  console.log(1)
  next(); // next不写会报错
  console.log(5)
});

app.use((ctx, next) => {
  console.log(2)
  next();
  console.log(4)
});

app.use((ctx, next) => {
  console.log(3)
  ctx.body = 'Hello World';
});

app.listen(3000);
// 打印出1、2、3、4、5
```

上述简单的应用打印出1、2、3、4、5，这就是一个洋葱结构，从上往下一层一层进来，再从下往上一层一层回去，解决复杂应用中频繁的回调而设计的级联代码，并不直接把控制权完全交给下一个中间件，而是碰到next去下一个中间件，等下面都执行完了，还会执行next以下的内容。



#### `app.use(function)` 做了什么

`app.use(fn)` 将给定的中间件方法添加到此应用的 `middleware` 数组。

当我们执行` use()` 时，会先判断传递的中间件是否是一个函数，如果不是就报出错误：

```
middleware must be a function!
```

再判断中间件是否是旧版的生成器 `generator` ，如果是，就使用 `koa-convert `来转换成新的中间件，最后将中间件 `push` 到 `middleware` 数组里面。

```js
 /**
   * Use the given middleware `fn`.
   *
   * Old-style middleware will be converted.
   *
   * @param {Function} fn
   * @return {Application} self
   * @api public
   */

  use(fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
    if (isGeneratorFunction(fn)) {
      deprecate('Support for generators will be removed in v3. ' +
                'See the documentation for examples of how to convert old middleware ' +
                'https://github.com/koajs/koa/blob/master/docs/migration.md');
      fn = convert(fn);
    }
    debug('use %s', fn._name || fn.name || '-');
    this.middleware.push(fn); // 中间件添加到数组
    return this;
  }
```

从上面的源码我们可以看出，当我们在应用里面使用多个中间件时，`koa` 都会将它们放在自身的一个数组 `middleware` 中。