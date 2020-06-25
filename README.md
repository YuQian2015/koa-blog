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