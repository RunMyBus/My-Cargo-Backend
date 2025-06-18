const mongoose = require('mongoose');
const util = require('util');
const logger = require('../utils/logger');
const debug = require('debug')('express-mongoose-es6-rest-api:index');
const config = process.env;

let mongoUrl = '';
if (!config.DB_HOST) {
    logger.error('mongo host is missing');
} else if (!config.DB_PORT) {
    logger.error('mongo port is missing');
} else if (!config.DB_NAME) {
    logger.error('mongo database is missing');
} else if (config.DB_USER && config.DB_PASS) {
    mongoUrl =
        'mongodb://' +
        config.DB_USER +
        ':' +
        config.DB_PASS +
        '@' +
        config.DB_HOST +
        '/' +
        config.DB_NAME;
} else {
    mongoUrl = 'mongodb://' + config.DB_HOST + ':' + config.DB_PORT + '/' + config.DB_NAME;
}
mongoose.connect(mongoUrl,)
    .then(() => logger.info('Connected to MongoDB ' + mongoUrl))
    .catch(err => {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    });


// print mongoose logs in dev env
if (config.MONGOOSE_DEBUG) {
    mongoose.set('debug', (collectionName, method, query, doc) => {
        debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
    });
}
