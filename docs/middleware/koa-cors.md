### 了解CORS

#### 什么是CORS

跨域资源共享（Cross-Origin Resource Sharing）是一种机制，用来允许不同源服务器上的指定资源可以被特定的Web应用访问。

#### 同源策略

同源是指不同的站点间，域名、端口、协议都相同，浏览器的同源策略（same-origin policy）出于安全原因，会限制浏览器的跨源 HTTP 请求。

#### 哪些情况遵循同源策略

- 由 XMLHttpRequest 或 Fetch 发起的跨域 HTTP 请求。
- Web 字体 (CSS 中通过 @font-face 使用跨域字体资源)。
- WebGL 贴图
- 使用 drawImage 将 Images/video 画面绘制到 canvas

#### 为什么需要CORS

Web应用向服务器请求资源时，由于同源策略限制，Web应用程序只能从同一个域请求 HTTP 资源。如果服务器和Web应用不在同一个域，会发起一个跨域 HTTP 请求。

#### CORS响应头部

当响应报文包含了正确CORS响应头， Web应用程序才能从跨域的服务器加载资源。

- Access-Control-Allow-Origin - 指定了允许访问该资源的外域 URI
- Access-Control-Expose-Headers - 服务器设置允许浏览器访问特定的头
- Access-Control-Max-Age - 指定预请求的结果能够被缓存多久
- Access-Control-Allow-Credentials - 当浏览器的 `credentials` 设置为true时是否允许浏览器读取 response 的内容
- Access-Control-Allow-Methods - 预检请求的响应，指明实际请求所允许使用的 HTTP 方法
- Access-Control-Allow-Headers - 预检请求的响应，指明实际请求中允许携带的首部字段

### Koa-cors

*Koa-cors 是基于 [node-cors](https://github.com/troygoode/node-cors) 开发的 Koa CORS中间件。*

#### 安装

```shell
$ npm install koa-cors --save
```

#### 使用

```js
var koa = require('koa');
var route = require('koa-route');
var cors = require('koa-cors');
var app = koa();

app.use(cors());

app.use(route.get('/', function() {
  this.body = { msg: 'Hello World!' };
}));

app.listen(3000);
```

#### 配置

具体的配置参考 [koa-cors](https://github.com/evert0n/koa-cors) 文档，这里做简单介绍

- `origin` ：配置 **Access-Control-Allow-Origin** 头部
- `expose` ：配置 **Access-Control-Expose-Headers** 头部
- `maxAge` ：配置 **Access-Control-Max-Age** 头部
- `credentials` ：配置 **Access-Control-Allow-Credentials** 头部
- `methods` ：配置 **Access-Control-Allow-Methods** 头部
- `headers` ：配置 **Access-Control-Allow-Headers**  头部



### 参考资料

- [MDN - HTTP访问控制（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)