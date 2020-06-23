let { article } = require('../service'); // 引入service

class ArticleController {
  // 接收请求传过来的body
  async create(reqBody) {
    try {
      let newMaterial = await material.create(reqBody);
    } catch (err) {
      throw new Error(err);
    }
  }
}

module.exports = new ArticleController();
