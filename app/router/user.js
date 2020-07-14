// app/router/home.js

const router = require('koa-router')();
const { user } = require('../controller'); // 引入 user controller

router.post('/register', user.create);

module.exports = router;