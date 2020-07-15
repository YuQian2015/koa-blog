// app/controller/user.js

const { user } = require("../service"); // 引入service

class UserController {
  async create(ctx) {
    try {
      const { email, password, name, sex } = ctx.request.body;
      const newUser = await user.create({
        email, password, name, sex
      });
      ctx.setResponse(newUser);
    } catch (err) {
      ctx.status = 400;
      throw new Error(err);
    }
  }
}

module.exports = new UserController();
