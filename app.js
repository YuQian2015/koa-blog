// app.js
const Koa = require('koa');
const app = new Koa();

// 响应
app.use(ctx => {
    ctx.response.body = 'Hello World';
});

app.listen(3000);