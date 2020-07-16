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

### koa-cors