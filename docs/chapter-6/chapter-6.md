*我们的系统需要支持浏览和查找数据，或者新增和创建数据，为了更高效地存取信息，网站将使用到数据库。 *

经过前面的实战，我们已经有了下面的目录结构：

```
koa-blog
├── .env.example
├── .env
├── .gitignore
├── app
│   ├── middleware
│   │   └── logger.js
│   ├── router
│   │   ├── home.js
│   │   └── index.js
│   ├── util
│   │   └── log_format.js
│   └── view
│       ├── 404.html
│       └── index.html
├── app.js
├── config
│   ├── config.js
│   ├── custom-environment-variables.json
│   ├── default.json
│   └── production.json
├── package.json
└── README.md
```

下面我们开始使用 Mongoose 来操作 MongoDB 数据库，并且将逐一创建 **modal** 、 **service**、**controller** 。

### 关于Mongoose

Koa 应用支持多款数据库，从而可以执行新建（**C**reate）、读取（**R**ead）、更新（**U**pdate）和删除（**D**elete）操作 (CRUD) 。我们这里准备使用 MongoDB 作为数据库。

#### 与数据库交互的方式

- 直接使用数据库的原生查询语言（如SQL、MongoDB ）
- 使用对象数据模型（Object Data Model，简称 ODM）或对象关系模型（Object Relational Model，简称 ORM）。 ODM / ORM 能将网站中的数据表示为 JavaScript 对象，然后将它们映射到底层数据库。一些 ORM 只适用某些特定数据库，还有一些是普遍适用的。

了解以上这些，我们来介绍今天的主角 [Mongoose](https://www.npmjs.com/package/mongoose) ，它是一款为异步工作环境设计的 [MongoDB](https://www.mongodb.org/) 对象建模工具。

### 安装Mongoose

```shell
$ npm install mongoose --save
```

安装 Mongoose 会添加 MongoDB 数据库驱动程序在内的所有依赖项，再加上我们在前面的实战安装设置好了 MongoDB ，我们现在可以直接使用 Mongoose 连接数据库。

### 连接MongoDB

我们可以使用 `require()` 引入 `mongoose` ，并通过 `mongoose.connect()` 连接到本地数据库，但是为了方便管理，我们还是单独建立一个 `plugin.js` 文件来连接：

```js
// config/plugin.js

const mongoose = require('mongoose');
const config = require('config');
const dbConfig = config.get('Database');

exports.mongooseConnect = (request, response) => {
    mongoose.connect(`mongodb://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.dbName}?authSource=${dbConfig.dbName}`);
    let db = mongoose.connection;
    db.on('error', () => {
        console.log('Mongoose连接错误: ' + err);
    });
    db.once('open', (callback) => {
        console.log(`Mongoose连接到${dbConfig.dbName}`);
    });
}
```

然后在 `app.js` 引入 `config/plugin.js`：

```js
// app.js
require('dotenv-safe').config(); // 只需要引入一次
const Koa = require('koa');
const config = require('config'); // 引入config
const appConfig = config.get('App'); // 直接使用 config 获取App的配置
const apiPrefix = config.get('Router.apiPrefix'); // 可以通过Router.apiPrefix获取具体的值
const dbConfig = config.get('Database');
const { mongooseConnect } = require('./config/plugin');
mongooseConnect();
// ...
```

我们启动服务 `npm start` 即可看到数据库连接成功：

```shell
服务已经启动，访问：http://localhost:3001/api
Mongoose连接到koaBlog
```

### 创建Schema

我们数据库的模型使用 `Schema` 接口进行定义，在 mongoose 中，所有的东西都从 [Schema](http://www.nodeclass.com/api/mongoose.html#guide) 中衍生出来。 `Schema` 可以定义每个文档中存储的字段及字段的验证要求和默认值。

我们先来定义一个Schema（模式），在 `app` 目录新建一个文件夹 `model` ，再在其中建一个文件 `article.js` ：

```js
// app/model/article.js

// 引入 Mongoose
const mongoose = require('mongoose');

// 定义一个模式
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
    title: { // 标题
        type: String,
        required: true
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' }, // 作者
    content: String, // 正文
    status: { // 1 未发布 2 发布
        type: Number,
        default: 1
    },
    summary: String, // 简介
    cover: String, // 封面
    publishDate: Date, // 发布时间
}, {
    timestamps: { // 使用时间戳
        createdAt: 'createDate', // 将创建时间映射到createDate
        updatedAt: 'updateDate' // 将修改时间映射到updateDate
    }
});

// 使用populate查询作者的信息
ArticleSchema.pre('findOne', function () {
    this.populate('author', '_id name sex avatarUrl');
});
```

上面的代码片段中定义了一个简单的模式。首先引入 `mongoose` ，然后使用 `Schema` 构造器创建一个新的模式实例，使用构造器的对象参数定义各个**字段**、**类型**以及**默认值**。并且我们使用了 mongoose 提供的 `timestamps` 设置了**创建时间**和**修改时间**，以后将为我们自动设置。

### 创建Model

定义模型（model）类后，可以使用它们来创建、更新或删除记录，以及通过查询来获取所有记录或特定子集。

我们使用 `mongoose.model('集合别名'， 模式)` 方法从模式创建模型：

```diff
// app/model/article.js

// 引入 Mongoose
const mongoose = require('mongoose');

// 定义一个模式
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
    title: { // 标题
        type: String,
        required: true
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' }, // 作者
    content: String, // 正文
    status: { // 1 未发布 2 发布
        type: Number,
        default: 1
    },
    summary: String, // 简介
    type: { // 类型 1 同事圈 2 知识库 3 专栏号
        type: Number,
        default: 0
    },
    cover: String, // 封面
    publishDate: Date, // 发布时间
}, {
    timestamps: { // 使用时间戳
        createdAt: 'createDate', // 将创建时间映射到createDate
        updatedAt: 'updateDate' // 将修改时间映射到updateDate
    }
});

// 使用populate查询作者的信息
ArticleSchema.pre('findOne', function () {
    this.populate('author', '_id name sex avatarUrl');
});

+ module.exports = mongoose.model('Article', ArticleSchema);
```

### 创建Service

在上面的实战中，我们已经创建好了模型（model），接下来我们可以通过 `model` 实例调用 `save()` 来创建记录。这些方法都是 mongoose 提供给我们的，为了方便以后抽出通用的方法操作（CRUD），这里新增一个通用的 service 来对模型进行调用。

首先新建 `service` 目录，创建 `base.js` 文件，这个文件将处理一些通用的 modal 调用逻辑：

```js
// app/service/base.js

class Service {
    constructor(model) {
        this.model = model
    }

    // 创建记录
    create = (data) => {
        return new Promise((resolve, reject) => {
            let model = new this.model(data);
            model.save((err, data) => {
                if (err) {
                    console.log(err)
                    reject(err);
                    return
                }
                console.log('创建成功');
                resolve(data)
            });
        })
    }
}

module.exports = Service;
```

接着我们将创建新的 `service` ，新建文件  `app/service/article.js`  ，创建一个 `class` 进行导出，完整代码如下：

```js
// app/service/article.js

const articleModel = require('../model/article');
const Service = require('./base');

class ArticleService extends Service {
    constructor() {
        super(articleModel)
    }
    // ...
}

module.exports = new ArticleService();
```

当然，还需要将 `service` 导出，以提供 `controller` 使用，因此在 `app/service` 目录创建 `index.js` 文件：

```js
// app/service/index.js

const article = require('./article');

module.exports = {
    article
};
```

到这里，我们的 service 创建完毕，接下来需要来调用 service 进行数据操作。

### 创建Controller

Controller（控制器）是应用程序中处理用户交互的部分，通常控制器负责从视图读取数据，控制用户输入，并向模型发送数据。接下来我们将创建 `controller` 向 `service` 发送数据。

首先创建 `app/controller ` 目录和对应的文件 `app/controller/index.js` 、 `app/controller/article.js`  ：

```js
// app/controller/article.js

const { article } = require("../service"); // 引入service

class ArticleController {
  async create(ctx) {
    try {
      const newArticle = await article.create({
        title: "第一条数据",
        content: "从零开始的koa实战",
        summary: "实战"
      });
      ctx.body = newArticle;
    } catch (err) {
      ctx.body = err;
      throw new Error(err);
    }
  }
}

module.exports = new ArticleController();
```

上面的代码中，我们先固定创建一条数据，在 `ArticleController` 中，我们使用了 `service` 定义的 `create` 方法来向数据库创建记录，并且我们依照 ArticleSchema 定义的数据模型进行传参。接着，将 `ArticleController`  导出：

```js
// app/controller/index.js

const article = require('./article');

module.exports = {
  article,
};
```

### 修改路由

前面已经将新增数据的处理逻辑对应到了 controller，接下来我们修改 `routes/index.js` 的路由设置，让请求能够指定到对应的 controller 上。在下面的代码中，我们暂时使用 get 类型来做测试：

```diff
// app/router/index.js

const Router = require('koa-router');
const config = require('config'); // 引入config
const apiPrefix = config.get('Router.apiPrefix');
const router = new Router();
router.prefix(apiPrefix); // 设置路由前缀
const home = require('./home');
+ const { article } = require('../controller'); // 引入controller

const index = async (ctx, next) => {
    await ctx.render('index', {title: 'Index', link: 'home'});
};

router.get('/', index);
router.get('/index', index);
+ router.get('/article', article.create);
router.use('/home', home.routes(), home.allowedMethods()); // 设置home的路由

module.exports = router;
```

我们将路由的 `/article` 对应到了 `articleController` 的 `create` 方法，当我们重启服务之后，在浏览器访问： http://localhost:3000/api/article ，可以看到已经创建了一条数据。页面中显示的数据如：

```json
{"status":1,"_id":"5ef204b5b40da108dc47ae30","title":"第一条数据","content":"从零开始的koa实战","summary":"实战","createDate":"2020-06-23T13:33:41.858Z","updateDate":"2020-06-23T13:33:41.858Z","__v":0}
```

到这里，我们已经能够通过请求对MongoDB数据库进行数据插入，以后我们还将继续完善各项逻辑。


参考资料：

https://developer.mozilla.org/zh-CN/docs/learn/Server-side/Express_Nodejs/mongoose