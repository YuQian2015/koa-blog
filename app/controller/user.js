// app/controller/user.js

const { user } = require("../service"); // 引入service

class UserController {
  async create(ctx) {
    try {
      console.log(ctx);
      
      const { email, password, name } = ctx.request.body;
      const newUser = await user.create({
        email, password, name
      });
      ctx.setResponse({ data: newUser });
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }
}

module.exports = new UserController();
