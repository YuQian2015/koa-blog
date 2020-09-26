## Koa中间件使用之koa-nunjucks-2

[Koa-nunjucks-2](https://github.com/strawbrary/koa-nunjucks-2) 是 [Koa](http://koajs.com/) 的一个轻量级 [Nunjucks](https://mozilla.github.io/nunjucks/) 中间件，可以用来作为模板引擎，为 koa 应用提供页面渲染功能。

那么，koa-nunjucks-2 做了什么？

1. 通过创建 `koa-nunjucks-2` 实例会返回一个中间件，使用这个中间件会让上下文获得一个渲染方法；
2. 从渲染方法参数上获取传递的数据（其次从 `ctx.state` 获取），然后使用 nunjucks 渲染模板；
3. 根据用户配置决定是否返回HTML页面。

可以参考从源码里面截取的片段，如下：

```js
const env = nunjucks.configure(config.path, config.nunjucksConfig);
  env.renderAsync = bluebird.promisify(env.render);
```

```js
  return async (ctx, next) => {
    if (ctx[config.functionName]) {
      throw new Error(`ctx.${config.functionName} is already defined`);
    }

    /**
     * @param {string} view
     * @param {!Object=} context
     * @returns {string}
     */
    ctx[config.functionName] = async (view, context) => {
      const mergedContext = merge({}, ctx.state, context);

      view += config.ext;

      return env.renderAsync(view, mergedContext)
        .then((html) => {
          if (config.writeResponse) {
            ctx.type = 'html';
            ctx.body = html;
          }
        });
    };

    await next();
  };
```

从上面的代码可以看出，在创建 koa-nunjucks-2 中间件时，可以传递文件后缀 `ext` ，渲染方法名 `functionName` ，以及 nunjucks 的配置信息 `nunjucksConfig` 等。

### 基本配置

#### 创建Koa应用

下面的代码创建了一个koa web服务，监听了3000端口，如果访问 http://localhost:3000/ 将返回 `Not Found` ，这是因为代码没有对请求做任何响应。后面将使用 koa-nunjucks-2 在这个基础上进行修改，使其支持渲染页面。

```js
// app.js

const Koa = require('koa'); // 引入koa

const app = new Koa(); // 创建koa应用

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})
```

#### 安装 koa-nunjucks-2

```shell
$ npm install koa-nunjucks-2 --save
```

#### 使用 koa-nunjucks-2

首先，使用 `require()` 引入 `koa-nunjucks-2` ，并且对其实例化（支持传递参数），然后会获得一个中间件。并且调用 `app.use()` 使用这个中间件：

```js
const Koa = require('koa'); // 引入koa
const koaNunjucks = require('koa-nunjucks-2'); // 引入 koa-nunjucks-2
const path = require('path');

const app = new Koa(); // 创建koa应用

// 使用 koa-nunjucks-2 实例获得中间件
app.use(koaNunjucks({
    ext: 'html', // 使用HTML后缀的模板
    path: path.join(__dirname, 'view'), // 模板所在路径
    nunjucksConfig: { // nunjucks的配置
        trimBlocks: true
    }
}));

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})
```

配置好 `koa-nunjucks-2` 中间件之后，它默认会在请求上下文（context）上增加 `render()` 方法，通过调用 `ctx.render('模板名', 数据)` 就可以渲染页面，比如下面代码：

```diff
// app.js

const Koa = require('koa'); // 引入koa
const koaNunjucks = require('koa-nunjucks-2'); // 引入 koa-nunjucks-2
const path = require('path');

const app = new Koa(); // 创建koa应用

// 使用 koa-nunjucks-2 实例获得中间件
app.use(koaNunjucks({
    ext: 'html', // 使用HTML后缀的模板
    path: path.join(__dirname, 'view'), // 模板所在路径
    nunjucksConfig: { // nunjucks的配置
        trimBlocks: true
    }
}));

+ app.use(async ctx => {
+     await ctx.render('index', { text: 'Hello World!' }); // 使用 ctx.render 可以通过 + nunjucks 渲染页面
+ })

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})
```

模板里面的代码如下：

```html
<!-- view/index.html -->

<h1>
    {{ text }}
</h1>
```

在调用 `ctx.render` 时传递的数据可以在模板里面通过插值表达式的形式 `{{ text }}` 渲染出来，可以访问 http://localhost:3000/ 进行确认。

### 配合 koa-router 使用

关于 koa-router 的使用可以参考这里：[Koa中间件使用之koa-router](./koa-router.md) ，这里使用 koa-router 来匹配路径，从而达到渲染不同页面的目的。

先来在代码里面加入 `koa-router` ：

```diff
// app.js

// ...
+ const Router = require('koa-router');

const app = new Koa(); // 创建koa应用
+ const router = new Router();

// 使用 koa-nunjucks-2 实例获得中间件
app.use(koaNunjucks({
    ext: 'html', // 使用HTML后缀的模板
    path: path.join(__dirname, 'view'), // 模板所在路径
    nunjucksConfig: { // nunjucks的配置
        trimBlocks: true
    }
}));

- app.use(async ctx => {
+ router.get('/', async ctx => {
    await ctx.render('index', { text: 'Hello World!' }); // 使用 ctx.render 可以通过 nunjucks 渲染页面
})

+ app.use(router.routes()).use(router.allowedMethods());

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})
```

上面的代码中， `app.use(nunjucks({}))` 放在 `app.use(router.routes()).use(router.allowedMethods())` 前面才行，否则会报 `ctx.render()` 不是一个 `function` 。

### Nunjucks使用

这里指列举一些使用方法，具体可以参考 nunjucks 的[文档](https://mozilla.github.io/nunjucks/cn/templating.html) 。

#### 变量

变量会从模板上下文获取，如果你想显示一个变量可以：

```jinja
{{ username }}
```

会从上下文查找 `username` 然后显示，可以像 javascript 一样获取变量的属性：

```jinja
{{ foo.bar }}
{{ foo["bar"] }}
```

#### 过滤器

过滤器是一些可以执行变量的函数，通过管道操作符 (`|`) 调用，并可接受参数。

```jinja
{{ foo | title }}
{{ foo | join(",") }}
{{ foo | replace("foo", "bar") | capitalize }}
```

第三个例子展示了链式过滤器，最终会显示 "Bar"，第一个过滤器将 "foo" 替换成 "bar"，第二个过滤器将首字母大写。

Nunjucks 提供了一些[内置的过滤器](https://mozilla.github.io/nunjucks/cn/templating.html#内置的过滤器)，你也可以[自定义过滤器](https://mozilla.github.io/nunjucks/cn/api#custom-filters)。

#### if

`if` 为分支语句，与 javascript 中的 `if` 类似。

```
{% if variable %}
  It is true
{% endif %}
```

如果 `variable` 定义了并且为真值。

```
{% if hungry %}
  I am hungry
{% elif tired %}
  I am tired
{% else %}
  I am good!
{% endif %}
```

#### for

`for` 可以遍历数组 (arrays) 和对象 (dictionaries)。

```js
var items = [{ title: "foo", id: 1 }, { title: "bar", id: 2}];
```

```
<h1>Posts</h1>
<ul>
{% for item in items %}
  <li>{{ item.title }}</li>
{% else %}
  <li>This would display if the 'item' collection were empty</li>
{% endfor %}
</ul>
```

更多的使用这里不再列举，可以查看官方的文档。