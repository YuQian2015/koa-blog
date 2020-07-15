// app/middleware/response_handler.js

module.exports = () => {
    // 导出一个方法
    return async (ctx, next) => {
        try {
            // 为ctx增加一个setResponse函数用于设置响应数据
            ctx['setResponse'] = async (data = {}) => {
                ctx.type = 'json';
                ctx.body = {
                    success: true,
                    message: "",
                    data,
                    code: 200,
                };
            };
            await next();
        } catch (err) {
            // 4xx的错误返回给客户端
            if (ctx.status >= 400 && ctx.status < 500) {
                ctx.body = {
                    success: false,
                    message: err.message,
                    data: {},
                    code: ctx.status,
                };
            }
        }
    };
};