const { AsyncLocalStorage } = require('async_hooks');
const mongoose = require('mongoose');

class RequestContext {
    constructor() {
        this.storage = new AsyncLocalStorage();
    }

    get() {
        return this.storage.getStore() || {};
    }

    getRequestId() {
        return this.get().requestId;
    }

    middleware() {
        return (req, res, next) => {
            const context = {
                requestId: `${new mongoose.Types.ObjectId()} - ${req.originalUrl}`,
                timestamp: new Date(),
                pid: process.pid,
                userId: req.user?.id,
                operatorId: req.user?.operatorId
            };
            this.storage.run(context, () => {
                next();
            });
        };
    }
}

module.exports = {
    instance: new RequestContext(),
    get() {
        return this.instance.get();
    },
    getRequestId() {
        return this.instance.getRequestId();
    },
    getOperatorId() {
        return this.get().operatorId;
    }
};
