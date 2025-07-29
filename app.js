require('dotenv').config();
const config = process.env;

const app = require('./config/express');
require('./database/mongoose');
const logger = require('./utils/logger');
const passport = require('passport');
const { instance: requestContext } = require('./utils/requestContext'); // import request context

// Passport middleware (assuming it sets req.user)
app.use(passport.initialize());
app.use(passport.session && passport.session()); // if using sessions



// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});
// Request context middleware — must be after passport middleware!
app.use(requestContext.middleware());

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
    process.exit(1);
});

// Start the server only if not in test mode
if (!module.parent) {
    app.listen(config.APP_RUNNING_PORT, () => {
        logger.info(`server started on port ${config.APP_RUNNING_PORT} (${config.NODE_ENV})`);
    });
}

module.exports = app;
