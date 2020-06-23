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
