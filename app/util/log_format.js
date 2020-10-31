// app/util/log_format.js

const log4js = require('log4js');

const config = require('config'); // 引入config
const log4jsConfig= config.get('Log4js');
log4js.configure(log4jsConfig);

let logFormat = {};

// 分别获取到 categories 里面的 error 和 response 元素
// 目的是为了输出错误日志和响应日志
const errorLogger = log4js.getLogger('error');
const resLogger = log4js.getLogger('response');

//封装错误日志
logFormat.error = (ctx, error, resTime) => {
    if (ctx && error) {
        errorLogger.error(formatError(ctx, error, resTime));
    }
};

//封装响应日志
logFormat.response = (ctx, resTime) => {
    if (ctx) {
        resLogger.info(formatRes(ctx, resTime));
    }
};

//格式化响应日志
const formatRes = (ctx, resTime) => {
    let responserLog = formatReqLog(ctx.request, resTime); // 添加请求日志
    responserLog.push(`response status: ${ctx.status}`); // 响应状态码
    responserLog.push(`response body: \n${JSON.stringify(ctx.body)}`); // 响应内容
    responserLog.push(`------------------------ end\n`); // 响应日志结束
    return responserLog.join("\n");
};

//格式化错误日志
const formatError = (ctx, err, resTime) => {
    let errorLog = formatReqLog(ctx.request, resTime); // 添加请求日志
    errorLog.push(`err name: ${err.name}`); // 错误名称
    errorLog.push(`err message: ${err.message}`); // 错误信息
    errorLog.push(`err stack: ${err.stack}`); // 错误详情
    errorLog.push(`------------------------ end\n`); // 错误信息结束
    return errorLog.join("\n");
};

// 格式化请求日志
const formatReqLog = (req, resTime) => {
    let method = req.method;
    // 访问方法 请求原始地址 客户端ip
    let formatLog = [`\n------------------------ ${method} ${req.originalUrl}`, `request client ip: ${req.ip}`];

    if (method === 'GET') { // 请求参数
        formatLog.push(`request query: ${JSON.stringify(req.query)}\n`)
    } else {
        formatLog.push(`request body: ${JSON.stringify(req.body)}\n`)
    }

    formatLog.push(`response time: ${resTime}`); // 服务器响应时间
    return formatLog;
};

module.exports = logFormat;