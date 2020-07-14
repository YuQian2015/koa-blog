// app/model/user.js

// 引入 Mongoose
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
    uid: { // 用户ID
        type: String,
        required: true
    },
    email: String, // 用户邮箱
    password: String, // 用户密码
    name: { stuff: { type: String, trim: true } }, // 用户名，去除空格
    avatarUrl: String,  // 用户头像
    sex: {
        type: Number,
        default: 0
    }, // 性别 0未设置 1男 2女
}, {
    timestamps: { // 使用时间戳
        createdAt: 'createDate', // 将创建时间映射到createDate
        updatedAt: 'updateDate' // 将修改时间映射到updateDate
    }
});

module.exports = mongoose.model('User', UserSchema);