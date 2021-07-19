## Koa中间件使用之koa-jwt

[Koa-jwt](https://github.com/koajs/jwt) 是 koa 的一个验证 JSON Web Tokens 的中间件，它可以将浏览器携带在请求里面的 token 获取出来进行验证，并将验证之后的信息携带在上下文（context）里以供使用。本文将介绍 JWT 的基础知识、使用以及 koa-jwt 中间件的使用。

### JWT 原理、结构、和使用

#### 什么是 JWT

JWT（JSON Web Tokens） 是一种方便地实现服务器与客户端安全通讯的规范，是目前最流行的跨域认证解决方案。

#### JWT 原理

在介绍 JWT 之前，先来看看如何使用 session 和 cookie 做用户验证，流程一般如下：

1. 服务器验证客户端发送的用户名和密码后，在当前对话（session）保存用户信息相关数据并返回一个 session_id 给用户，写入用户 cookie。
2. 之后用户的每次请求都会通过 cookie 将 session_id 传回服务器，服务器收到 session_id，找到之前保存的数据并获得用户信息

上面这种方式，session 数据共享不方便，不好实现跨域服务，如果是服务器集群，需要实现 session 共享才能让每台服务器都能够进行用户验证。

使用 JWT，服务器认证用户之后，会生成包含一个 JSON 对象信息的 token 返回给用户，如：

```json
{
  "name": "moyufed",
  "role": "admin"
}
```

然后客户端请求服务的时候，都要带上该 token 以供服务器做验证。服务器还会为这个 JSON 添加签名以防止用户篡改数据。通过使用 JWT，服务端不再保存 session 数据，更加容易实现扩展。

#### JWT 结构

JWT 是一行使用 “.” 分割成三个部分的字符串，这被分隔的三个部分分别是：Header（头部）、Payload（负载）、Signature（签名），访问 https://jwt.io/  ，可以通过修改算法查看签名的计算公式以及结算结果。

第一部分（Header）实际上是一个 JSON 对象，是描述 JWT 的元数据，其中 `alg` 表示的是签名的算法，默认 HS256，`typ` 表示 token 的类型是 JWT，比如：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

第二部分（Payload）就是前面提到的 JSON 数据，是希望通过服务器发送给客户端的用户信息，可在这个 JSON 里面定义需要发送的字段，比如：

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

当然，JWT 官方提供了7个字段以供选用：

- iss (issuer)：签发人
- exp (expiration time)：过期时间
- sub (subject)：主题
- aud (audience)：受众
- nbf (Not Before)：生效时间
- iat (Issued At)：签发时间
- jti (JWT ID)：编号

第三部分（Signature）用来对 header 和 payload 两部分的数据进行签名，从而防止数据篡改，这个 signature 需要制定一个密钥（Secret），然后通过 header 里面制定的算法来产生签名。产生签名的算法也可以在 https://jwt.io/ 看到，比如：

```js
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  your-256-bit-secret
)
```

最终通过把上面三个部分组合成 Header.Payload.Signature 的形式返回给用户。

#### JWT 使用

客户端收到服务器返回的 token，可以储存在 cookie 或者 localStorage 里，在之后的请求需要上这个 token，通过以下方式携带 token：

- 通过 cookie 自动发送，但是这样不能跨域。
- 放在 HTTP 请求的头信息 Authorization 字段里面：`Authorization: Bearer <token>`。
- 将 token 放在 POST 请求的数据体里面。

*关于JWT的的介绍可以参考阮一峰的 [JSON Web Token 入门教程](http://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html)。*

### Koa-jwt 的使用

#### 创建 Koa 应用

下面的代码创建了一个 koa web 服务，监听了3000端口，并使用 [koa-router](https://github.com/ZijianHe/koa-router)  中间件来管理路由。关于 koa-router 这里有比较详细的使用指南： [Koa中间件使用之koa-router](./koa-router.md) 。

```js
// app.js

const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa(); // 创建koa应用
const router = new Router(); // 创建路由

router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = '<h1>hello world!</h1>';
})

app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})

```

#### 安装 koa-jwt

执行 `npm install` 安装 koa-jwt 中间件：

```shell
$ npm install koa-jwt
```

使用 `require` 引入 koa-jwt，并配置好密钥，在代码里面新增一个 `GET` 接口 `/auth` 来使用该中间件：

```javascript
// app.js

// ...
const jwt = require('koa-jwt');

// ...
const secret = 'moyufed-test'; // 定义一个密钥secret，这里只是做演示，建议放在项目配置里面

router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = '<h1>hello world!</h1>';
})

// 这里调用引入的jwt方法，最终会得到一个中间件，将中间件匹配到 / 路径
router.use(jwt({
    secret,
    debug: true // 开启debug可以看到准确的错误信息
}));

router.get('/auth', async (ctx, next) => {
    ctx.body = ctx.state.user; // 该中间件将验证后的用户数据直接返回给浏览器
});

// ...
```

通过浏览器访问 http://localhost:3000/auth  返回结果，这表示 `/auth` 的路由开始工作了，由于浏览器请求里面没有携带任何 token 信息，服务返回了认证错误 `Token not found` 。

#### 官方示例简介

```javascript
var Koa = require('koa');
var jwt = require('koa-jwt');

var app = new Koa();

// 中间件 自定义了 401 响应，将用户验证失败的相关信息返回给浏览器
app.use(function(ctx, next){
  return next().catch((err) => {
    if (401 == err.status) {
      ctx.status = 401;
      ctx.body = 'Protected resource, use Authorization header to get access\n';
    } else {
      throw err;
    }
  });
});

// 未受保护的中间件，一般用于开放的不需要用户验证的接口
app.use(function(ctx, next){
  if (ctx.url.match(/^\/public/)) {
    ctx.body = 'unprotected\n';
  } else {
    return next();
  }
});

// 后面的中间件只有jwt验证通过才会执行，达到用户验证的效果
app.use(jwt({ secret: 'shared-secret' }));

// 受保护的中间件，通常是需要用户验证的接口
app.use(function(ctx){
  if (ctx.url.match(/^\/api/)) {
    ctx.body = 'protected\n';
  }
});

app.listen(3000);
```

#### Token 验证

由于 koa-jwt 从 koa-v2 分支开始不再导出 `jsonwebtoken`  的 `sign` 、  `verify` 和 `decode` 方法，若要单独生成 token 、验证 token 等，需另从 `jsonwebtoken`  中将其引入：

```javascript
// app.js

// ...
const jwt = require('koa-jwt');
const { sign } = require('jsonwebtoken');

// ...

// 这里调用引入的jwt方法，最终会得到一个中间件
router.use(
    jwt({
        secret,
        cookie: 'token', // 从 cookie 中获取token
        debug: true // 开启debug可以看到准确的错误信息
    })
    .unless({ path: [/^\/public/] }) // 以 public 开头的请求地址不使用 jwt 中间件
);

router.get('/auth', async (ctx, next) => {
    ctx.body = ctx.state.user; // 该中间件将验证后的用户数据直接返回给浏览器
});

router.get('/public/token', async (ctx, next) => {
    const token = jsonwebtoken.sign({ name: 'moyufed' }, secret, { expiresIn: '3h' }) // token 有效期为3小时
    ctx.cookies.set(
        'token',
        token,
        {
            domain: 'localhost', // 设置 cookie 的域
            path: '/', // 设置 cookie 的路径
            maxAge: 3 * 60 * 60 * 1000, // cookie 的有效时间 ms
            expires: new Date('2021-12-30'), // cookie 的失效日期，如果设置了 maxAge，expires 将没有作用
            httpOnly: true, // 是否要设置 httpOnly
            overwrite: true // 是否要覆盖已有的 cookie 设置
        }
    )
    ctx.body = token;
})

// ...
```

上面的代码从 [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) 中引入了 `sign` 方法来生成 token （由于 koa-jwt 本身依赖于 jsonwebtoken，这里没有再安装），新增了一个 `/public/token` 路由使用 `GET` 请求方便浏览器查看，代码中还为 jwt 中间件增加了 `.unless({ path: [/^\/public/] })` 方法调用来允许 `/public/token` 不经过 jwt 验证，并设置 `cookie: 'token'` ，表示从 cookie 中获取  `'token'` 的值作为 token。

通过浏览器访问 http://localhost:3000/public/token 看到返回token，结构如：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibW95dWZlZCIsImlhdCI6MTYyNjY5MDU4NSwiZXhwIjoxNjI2NzAxMzg1fQ.92tJV5hix3ZP_10VsW7ml-DqoTr3iIZbMm_JJlooD5k
```

接着，浏览器再次访问 http://localhost:3000/auth ，可以看到获取的用户信息，如：

```json
{"name":"moyufed","iat":1626690585,"exp":1626701385}
```

由于代码已经将生成的 token 设置到 cookie 里面，浏览器后面发送的请求都会自动携带该 cookie，因此 koa-jwt 可以获取并经过验证，得到存放在 token 里面的信息。

**上面的代码示例通过 `cookie` 来存储 `token` ，但大多数场景则通过请求头的携带 `token` ，这时可以用 Authorization 作为请求头的 key，它的值为`'Bearer <token>'` 的结构，注意中间的空格 `' '` 。 **

#### Koa-jwt 如何从请求获取 token？

Koa-jwt 有三种途径获取 token：

1. 通过自定义 getToken 方法获取
2. 通过配置里的 cookie key值获取
3. 通过请求头里面的 Authorization 获取，Authorization 的格式一般是 `'Bearer <token>'` 

下面是 koa-jwt 从请求头获取token的源码片段：

```javascript
module.exports = function resolveAuthorizationHeader(ctx, opts) {
    if (!ctx.header || !ctx.header.authorization) { // 判断请求头里面是否有 authorization
        return;
    }

    const parts = ctx.header.authorization.trim().split(' '); // authorization是 Bearer + ' ' + jwt字符串

    if (parts.length === 2) {
        const scheme = parts[0];
        const credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) { // 判断 authorization 请求头是不是以 Bearer 开头
            return credentials; // 返回 token
        }
    }
    if (!opts.passthrough) {
        ctx.throw(401, 'Bad Authorization header format. Format is "Authorization: Bearer <token>"');
    }
};
```

下面是 koa-jwt 从 cookie 获取 token 的源码片段：

```javascript
module.exports = function resolveCookies(ctx, opts) {
    return opts.cookie && ctx.cookies.get(opts.cookie); // 单纯从 cookie 配置获取token
};
```

#### Koa-jwt 获取 token 的优先级?

`opts.getToken` > `opts.cookie` > `Authorization` 请求头，可参考源码：

```javascript
const resolveAuthHeader = require('./resolvers/auth-header'); // 从 header 获取
const resolveCookies = require('./resolvers/cookie'); // 从 cookie 获取

module.exports = (opts = {}) => {
    const { debug, getToken, isRevoked, key = 'user', passthrough, tokenKey } = opts;
    const tokenResolvers = [resolveCookies, resolveAuthHeader]; // 定义获取token的方法数组

    if (getToken && typeof getToken === 'function') {
        tokenResolvers.unshift(getToken); // 往前追加自定义的获取方法
    }
    
    const middleware = async function jwt(ctx, next) {
        let token;
        tokenResolvers.find(resolver => token = resolver(ctx, opts)); // 获取 token

        if (!token && !passthrough) {
            ctx.throw(401, debug ? 'Token not found' : 'Authentication Error');
        }
// ...
```

#### Koa-jwt 支持的配置有哪些？

- getToken：自定义获取 token 的方法
- secret：jwt 的密钥
- key：自定义token验证后的数据存放在 `ctx.state` 的 key 值，默认是 `ctx.state.user` 
- isRevoked：定义对无效的token进行报错 `'Token revoked'`
- passthrough：是否不进行401报错，如果为 `true` ，将在 ctx.state.jwtOriginalError 获取到验证错误信息，可以让后面的中间件自行处理。
- cookie：设置包含 token 的 cookie，如果设置了值，Koa-jwt 会优先从 cookie 获取 token。
- audience：提供给依赖的 `jsonwebtoken` 使用，用于检查 JWT 的 aud (audience 受众)。
- issuer：提供给依赖的 `jsonwebtoken` 使用，JWT 的 iss (issuer)：签发人，是 `iss` 字段中有效的 string 或 string 数组
- debug：是否开启调试，如果为 `true` 则会提示出准确信息

#### Koa-jwt 如何忽略特定路径？

Koa-jwt 使用 `unless` 表达式忽略滤路径，可以参考 [koa-unless](https://github.com/Foxandxss/koa-unless) ，使用示例：

```javascript
app.use(jwt({ secret: 'shared-secret' }).unless({ path: [/^\/public/] }));
```

### 完整代码

```javascript
// app.js

const Koa = require('koa');
const Router = require('koa-router');
const jwt = require('koa-jwt');
const jsonwebtoken = require('jsonwebtoken');

const app = new Koa(); // 创建koa应用
const router = new Router(); // 创建路由

const secret = 'moyufed-test'; // 定义一个密钥secret，这里只是做演示，建议放在项目配置里面

router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = '<h1>hello world!</h1>';
})

// 这里调用引入的jwt方法，最终会得到一个中间件
router.use(
    jwt({
        secret,
        cookie: 'token', // 从 cookie 中获取token
        debug: true // 开启debug可以看到准确的错误信息
    })
    .unless({ path: [/^\/public/] }) // 以 public 开头的请求地址不使用 jwt 中间件
);

router.get('/auth', async (ctx, next) => {
    ctx.body = ctx.state.user; // 该中间件将验证后的用户数据直接返回给浏览器
});

router.get('/public/token', async (ctx, next) => {
    const token = jsonwebtoken.sign({ name: 'moyufed' }, secret, { expiresIn: '3h' }) // token 有效期为3小时
    ctx.cookies.set(
        'token',
        token,
        {
            domain: 'localhost', // 设置 cookie 的域
            path: '/', // 设置 cookie 的路径
            maxAge: 3 * 60 * 60 * 1000, // cookie 的有效时间 ms
            expires: new Date('2021-12-30'), // cookie 的失效日期，如果设置了 maxAge，expires 将没有作用
            httpOnly: true, // 是否要设置 httpOnly
            overwrite: true // 是否要覆盖已有的 cookie 设置
        }
    )
    ctx.body = token;
})


app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务监听本地3000端口
app.listen(3000, () => {
    console.log('应用已经启动，http://localhost:3000');
})

```

### 总结

- JWT（JSON Web Tokens） 是一种方便地实现服务器与客户端安全通讯的解决方案，分为三个部分：Header、Payload、Signature，浏览器发送请求时将 token 带到服务器
- Koa-jwt 是 koa 的一个中间件，帮助 koa web 服务获取并解析请求里面的 token，有默认的获取 token 的方式，并且支持各种配置，依赖于`jsonwebtoken` 库进行工作

