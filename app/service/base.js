// app/service/base.js

class Service {
    constructor(model) {
        this.model = model
    }

    // 创建记录
    async create(data) {
        return new Promise((resolve, reject) => {
            let model = new this.model(data);
            model.save((err, data) => {
                if (err) {
                    console.log(err)
                    reject(err);
                    return
                }
                console.log('创建成功');
                resolve(data)
            });
        })
    }
}

module.exports = Service;
