// app/model/user.js

// 引入 Mongoose
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    // uid: { // 用户ID
    //     type: String,
    //     required: true
    // },
    email: { type: String, match: /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/, required: true, unique: true }, // 用户邮箱, 正则匹配，必填, 唯一
    password: { type: String, minlength: 6, required: true }, // 用户密码，6-32位
    name: { type: String, trim: true, minlength: 1, maxlength: 32, required: true, unique: true }, // 用户名，去除空格，1-32个字符，必填, 唯一
    avatarUrl: String,  // 用户头像
    sex: {
        type: Number,
        default: 0,
        enum: [0, 1, 2] // 只能是 0 1 2
    }, // 性别 0未设置 1男 2女
}, {
    timestamps: { // 使用时间戳
        createdAt: 'createDate', // 将创建时间映射到createDate
        updatedAt: 'updateDate' // 将修改时间映射到updateDate
    }
});

module.exports = mongoose.model('User', UserSchema);