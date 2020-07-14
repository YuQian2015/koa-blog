// app/middleware/response_handler.js

module.exports = () => {
    // 导出一个方法
    return async (ctx, next) => {
        // 为ctx增加一个setResponse函数用于设置响应
        ctx['setResponse'] = async ({ data = {}, code = 200 }) => {
            ctx.type = 'json';
            if (code === 200) {
                ctx.body = {
                    success: true,
                    message: "",
                    data,
                    code,
                };
            }
        };
        await next();
    };
};