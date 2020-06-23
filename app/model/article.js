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

module.exports = mongoose.model('Article', ArticleSchema);