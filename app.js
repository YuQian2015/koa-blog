// app.js
const Koa = require('koa');
const app = new Koa();

const fs = require('fs'); // 引入fs

/**
 * 从app/view目录读取HTML文件
 * @param {string} page 路由指向的页面
 * @returns {Promise<any>}
 */
function readPage( page ) {
    return new Promise(( resolve, reject ) => {
        const viewUrl = `./app/view/${page}`;
        fs.readFile(viewUrl, "binary", ( err, data ) => {
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