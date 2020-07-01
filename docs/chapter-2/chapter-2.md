*路由将 URL 解析到对应的处理程序。*

经过上一节的实战，我们已经有了下面的目录结构：

```
koa-blog
├── package.json
└── app.js
```

我们将使用 Koa 的中间件 [koa-router](https://github.com/alexmingoia/koa-router) 来处理请求，把请求解析到对应的控制器（controller）上，实现访问不同地址获得不同的结果。在这之前，我们先了解使用原生 Koa 实现路由的方式。

### Koa原生路由实现

#### 查看url信息

首先，通过 `ctx.request.url` 获取到当前请求的地址：

```js
// app.js
const Koa = require('koa');
const app = new Koa();

// 响应
app.use(ctx => {
    const { url } = ctx.request;
    ctx.response.body = url;
});

app.listen(3000);
```

启动服务之后我们在浏览器访问 http://localhost:3000 的任何一个地址，可在页面中看到返回的 url 信息。

#### 了解内容协商

Koa使用 [accepts](https://www.npmjs.com/package/accepts) 作为内容协商（content negotiation），`accept` 能告诉服务器浏览器接受什么样的数据类型，默认的返回类型是 `text/plain` ，若要返回其他类型的内容则用 `ctx.request.accepts` 在请求头部附带信息，然后用 `ctx.response.type` 指定返回类型，示例：

```js
const main = ctx => {
  if (ctx.request.accepts('xml')) {
    ctx.response.type = 'xml';
    ctx.response.body = '<data>Hello World</data>';
  } else if (ctx.request.accepts('json')) {
    ctx.response.type = 'json';
    ctx.response.body = { data: 'Hello World' };
  } else if (ctx.request.accepts('html')) {
    ctx.response.type = 'html';
    ctx.response.body = '<p>Hello World</p>';
  } else {
    ctx.response.type = 'text';
    ctx.response.body = 'Hello World';
  }
};
```

*可以使用 `acceptsEncodings` 设置接收返回的编码，`acceptsCharsets` 设置接收返回的字符集，`acceptsLanguages` 设置接收返回的语言。*

#### 控制页面访问

接下来我们通过对请求地址进行判断，并取到与之相对应的HTML页面返回到浏览器显示。因此，这里将建立几个HTML文件，把它们放在 `app/view/` 目录里面。

首先，新建 HTML 文件如下：

```html
<!--app/view/index.html-->
<h1>Index Page</h1>
<a href="home">home</a>

<!--app/view/home.html-->
<h1>Home Page</h1>
<a href="index">index</a>

<!--app/view/404.html-->
<h1>404 访问的页面不存在</h1>
<a href="home">home</a>
```

接着使用 Node.js 的文件系统实现HTML的读取，具体代码如下：

```js
/**
 * 从app/view目录读取HTML文件
 * @param {string} page 路由指向的页面
 * @returns {Promise<any>}
 */
function readPage( page ) {
    return new Promise(( resolve, reject ) => {
        const viewUrl = `./app/view/${page}`;
        fs.readFile(viewUrl, 'utf8', ( err, data ) => {
            if ( err ) {
                reject( err )
            } else {
                resolve( data )
            }
        })
    })
}
```

我们读取了创建在 `app/view/` 目录的 HTML 之后，通过判断请求的 `url` ，选择对应的页面进行返回到浏览器显示，完整代码：

```js
// app.js
const Koa = require('koa');
const fs = require('fs'); // 引入fs

const app = new Koa();

/**
 * 从app/view目录读取HTML文件
 * @param {string} page 路由指向的页面
 * @returns {Promise<any>}
 */
function readPage( page ) {
    return new Promise(( resolve, reject ) => {
        const viewUrl = `./app/view/${page}`;
        fs.readFile(viewUrl, 'utf8', ( err, data ) => {
            if ( err ) {
                reject( err )
            } else {
                resolve( data )
            }
        })
    })
}

// 路由
app.use(async ctx => {
    const {url} = ctx.request;
    let page;
    switch ( url ) {
        case '/':
            page = 'index.html';
            break;
        case '/index':
            page = 'index.html';
            break;
        case '/home':
            page = 'home.html';
            break;
        default:
            page = '404.html';
            break
    }
    ctx.response.type = 'html'; // 这里设置返回的类型是html
    ctx.response.body = await readPage(page);
});

app.listen(3000, () => {
    console.log('App started on http://localhost:3000')
});
```

然后我们启动服务，在浏览器访问 http://localhost:3000/index ，我们可以看到页面已经显示出来，点击里面的连接，就能够切换不同的页面。

### 使用koa-router

*从上面的实战可以看到，要针对不同的访问返回不同的内容，我们需要先获取请求的 url，以及请求的类型，再进行相应的处理，最后返回结果，考虑到使用原生路由处理请求会很繁琐，我们使用 [koa-router](https://github.com/alexmingoia/koa-router) 中间件来管理项目路由。*

这里有比较详细的 `koa-router` 中间件使用指南： [Koa中间件使用之koa-router](../middleware/koa-router.md) 。

#### 安装和使用

执行命令安装 koa-router：

```shell
$ npm install koa-router --save
```

接着修改之前的路由代码，使用 `koa-router`：

```js
// app.js
const Koa = require('koa');
const fs = require('fs'); // 引入fs
const Router = require('koa-router'); // 引入koa-router

const app = new Koa();
const router = new Router();

/**
 * 从app/view目录读取HTML文件
 * @param {string} page 路由指向的页面
 * @returns {Promise<any>}
 */
function readPage( page ) {
    return new Promise(( resolve, reject ) => {
        const viewUrl = `./app/view/${page}`;
        fs.readFile(viewUrl, 'utf8', ( err, data ) => {
            if ( err ) {
                reject( err )
            } else {
                resolve( data )
            }
        })
    })
}

// 原生路由
// app.use(async ctx => {
//     const {url} = ctx.request;
//     let page;
//     switch ( url ) {
//         case '/':
//             page = 'index.html';
//             break;
//         case '/index':
//             page = 'index.html';
//             break;
//         case '/home':
//             page = 'home.html';
//             break;
//         default:
//             page = '404.html';
//             break
//     }
//     ctx.response.type = 'html'; // 这里设置返回的类型是html
//     ctx.response.body = await readPage(page);
// });


// koa-router
const index = async (ctx, next) => {
    ctx.response.type = 'html';
    ctx.response.body = await readPage('./index.html');
};
const home = async (ctx, next) => {
    ctx.response.type = 'html';
    ctx.response.body = await readPage('./home.html');
};

router.get('/', index);
router.get('/index', index);
router.get('/home', home);

// 使用中间件 处理404
app.use(async (ctx, next) => {
    await next(); // 调用next执行下一个中间件
    if(ctx.status === 404) {
        ctx.response.type = 'html';
        ctx.response.body = await readPage('./404.html');
    }
});

// 使用koa-router中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
    console.log('App started on http://localhost:3000')
});
```

在以上代码中，我们使用 `ctx.response.type` 来设置响应的类型，响应内容为 HTML 标签，并且通过添加路由中间件，执行 `npm start` 启动服务即可预览。

#### 单独管理路由

从上面的实战可以看到，我们在 ` app.js` 的代码显得非常臃肿，考虑到以后项目会复杂很多，那样我们的代码将变得难以维护，因此下面来把路由独立出来，放在单独的文件夹管理：

```js
// app/router/index.js

const fs = require('fs'); // 引入fs

const Router = require('koa-router');
const router = new Router();

/**
 * 从app/view目录读取HTML文件
 * @param {string} page 路由指向的页面
 * @returns {Promise<any>}
 */
function readPage( page ) {
    return new Promise(( resolve, reject ) => {
        const viewUrl = `./app/view/${page}`;
        fs.readFile(viewUrl, 'utf8', ( err, data ) => {
            if ( err ) {
                reject( err )
            } else {
                resolve( data )
            }
        })
    })
}

// koa-router
const index = async (ctx, next) => {
    ctx.response.type = 'html';
    ctx.response.body = await readPage('./index.html');
};
const home = async (ctx, next) => {
    ctx.response.type = 'html';
    ctx.response.body = await readPage('./home.html');
};

router.get('/', index);
router.get('/index', index);
router.get('/home', home);

module.exports = router;

```

```js
// app.js
const Koa = require('koa');
const app = new Koa();

// 引入路由文件
const router = require('./app/router');

// 使用中间件 处理404
app.use(async (ctx, next) => {
    await next(); // 调用next执行下一个中间件
    if(ctx.status === 404) {
        ctx.response.type = 'html';
        ctx.response.body = '404'; // 移除了读取页面的方法
    }
});

// 使用koa-router中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
    console.log('App started on http://localhost:3000')
});
```

通过上面的代码，我们已经实现路由独拿在一个目录维护，以后我们都将在 `app/router/` 里面进行路由的创建，重新启动服务，访问 http://localhost:3000/ 看看是否生效。

#### 使用模板引擎

为了便于读取模板和渲染页面，我们将使用中间件 [koa-nunjucks-2](https://www.npmjs.com/package/koa-nunjucks-2) 来作为模板引擎。

首先安装 koa-nunjucks-2 :

```shell
$ npm i koa-nunjucks-2 --save
```

在使用路由中间件之前应用 koa-nunjucks-2：

```js
// app.js
const Koa = require('koa');
const app = new Koa();

// 引入模板引擎
const koaNunjucks = require('koa-nunjucks-2');
const path = require('path');

// 引入路由文件
const router = require('./app/router');

// 使用模板引擎
app.use(koaNunjucks({
    ext: 'html',
    path: path.join(__dirname, 'app/view'),
    nunjucksConfig: {
        trimBlocks: true // 开启转义 防止Xss
    }
}));

// 使用中间件 处理404
app.use(async (ctx, next) => {
    await next(); // 调用next执行下一个中间件
    if(ctx.status === 404) {
        await ctx.render('404');
    }
});

// 使用koa-router中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
    console.log('App started on http://localhost:3000')
});
```

```js
// app/router/index.js

const Router = require('koa-router');
const router = new Router();

// koa-router
const index = async (ctx, next) => {
    await ctx.render('index', {title: 'Index', link: 'home'});
};
const home = async (ctx, next) => {
    await ctx.render('index', {title: 'Home', link: 'index'});
};

router.get('/', index);
router.get('/index', index);
router.get('/home', home);

module.exports = router;
```

我们的路由统一使用了 `app/view/index.html` 作为模板文件，因此删除没有用到的文件 `app/view/home.html` ，在 `app/view/index.html` 中我们接收了传递的参数：

```html
<!--app/view/index.html-->
<h1>{{title}} Page</h1>
<a href="/{{link}}">home</a>
```

#### 分模块管理路由

为了细化路由，我们将根据业务分开管理路由：

```js
// app/router/home.js

const router = require('koa-router')();

router.get('/', async (ctx, next) => {
    await ctx.render('index', {title: 'Home', link: 'index'});
});

module.exports = router;


// app/router/index.js

const Router = require('koa-router');
const router = new Router();
const home = require('./home');

const index = async (ctx, next) => {
    await ctx.render('index', {title: 'Index', link: 'home'});
};

router.get('/', index);
router.get('/index', index);
router.use('/home', home.routes(), home.allowedMethods()); // 设置home的路由

module.exports = router;
```

我们将首页相关的业务放到了 `app/router/home.js` 文件中进行管理，并且在  `app/router/index.js`中引入了，为 `home` 分配了一个路径 `/home`，以后就通过这个路由增加首页相关的功能，重启服务，访问 http://localhost:3000/home 即可看到配置的路由。

#### 为路由增加前缀

```js
// config/config.js

const CONFIG = {
    "API_PREFIX": "/api" // 配置了路由前缀
};
module.exports = CONFIG;


// app/router/index.js

const config = require('../../config/config');

const Router = require('koa-router');
const router = new Router();
router.prefix(config.API_PREFIX); // 设置路由前缀
const home = require('./home');

const index = async (ctx, next) => {
    await ctx.render('index', {title: 'Index', link: 'home'});
};

router.get('/', index);
router.get('/index', index);
router.use('/home', home.routes(), home.allowedMethods()); // 设置home的路由

module.exports = router;


// app.js
const Koa = require('koa');
const app = new Koa();
//...
app.listen(3000, () => {
    console.log('App started on http://localhost:3000/api')
});
```

```html
<!--app/view/404.html-->
<h1>404</h1>
<a href="/api/index">index</a>

<!--app/view/index.html-->
<h1>{{title}} Page</h1>
<a href="/api/{{link}}">home</a>
```

重新启动服务，访问 http://localhost:3000/api 和  http://localhost:3000/api/home 即可看到新配置的路由。

完成这一节实战之后，整个文件目录如下：

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
下一步，我们来实现log… 