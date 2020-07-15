// app/router/home.js

const router = require('koa-router')();
const { user } = require('../controller'); // 引入 user controller

router.post('/', user.create); // post请求，指定到创建用户

module.exports = router;