### 前期准备

为了更好的使用 `async/await` ，我们选择 **7.6.0** 以上的 node.js 环境，当然，我们可以使用 nvm 来管理多版本node.js（这里不作介绍）。安装好 node.js ，检查版本：

```shell
$ node -v
v8.9.1
```

### 初始化项目

新建一个文件夹 `koa-blog`，先来初始化目录结构：

```shell
$ mkdir koa-blog

$ cd koa-blog

$ npm init -y

```

当然，我们还得安装 Koa：

```shell
$ npm install koa --save
```

### 项目入口

我们来创建一个HTTP服务，实现 “Hello World”：

```js
// app.js
const Koa = require('koa');
const app = new Koa();

// 响应
app.use(ctx => {
  ctx.response.body = 'Hello World';
});

app.listen(3000);
```

在上面的代码中，`app.use()` 指定了一个中间件方法，这个中间件接收 Koa 创建的上下文（context），并且修改了 `response.body` 发送给客户端。

*Koa 上下文将 `request` 和 `response` 对象封装到单个对象中，为编写 web 应用程序和 API 提供了许多有用的方法。*

接下来就是启动服务，执行：

```shell
node app.js
```

浏览器访问 http://localhost:3000/ , 可以看到显示 “Hello World” 字样，证明我们服务已经搭建好。

为了方便，我们将这个命令配置在 `package.json` 中：

```js
// package.json
{

  // ...
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  // ...
}

```

以后只要在命令行执行 `npm start` 即可启动服务。