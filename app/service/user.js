// app/service/user.js

const userModel = require('../model/user');
const Service = require('./base');

class UserService extends Service {
    constructor() {
        super(userModel)
    }
    // ...
}

module.exports = new UserService();