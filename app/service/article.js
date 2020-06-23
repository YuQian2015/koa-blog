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