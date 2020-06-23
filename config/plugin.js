// config/plugin.js

const mongoose = require('mongoose');
const config = require('config');
const dbConfig = config.get('Database');

exports.mongooseConnect = (request, response) => {
    mongoose.connect(`mongodb://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.dbName}?authSource=${dbConfig.dbName}`);
    let db = mongoose.connection;
    db.on('error', (err) => {
        console.log('Mongoose连接错误: ' + err);
    });
    db.once('open', (callback) => {
        console.log(`Mongoose连接到${dbConfig.dbName}`);
    });
}