// app/service/base.js

class Service {
    constructor(model) {
        this.model = model
    }

    // 创建记录
    create(data) {
        return this.model(data).save()
    }
}

module.exports = Service;
