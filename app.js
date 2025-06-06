// config should be imported before importing any other file
require('dotenv').config();
config = process.env;
const app = require('./config/express');
require('./database/mongoose');
const logger = require('./utils/logger');

// Configure error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});


// module.parent check is required to support mocha watch
if (!module.parent) {
    app.listen(config.APP_RUNNING_PORT, () => {
    logger.info(`server started on port ${config.APP_RUNNING_PORT} (${config.NODE_ENV})`);
    });
}



module.exports = app;
