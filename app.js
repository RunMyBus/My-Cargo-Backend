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

// Error handling middleware (should be after all other middlewares and routes)
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server only if not in test mode
if (!module.parent) {
    app.listen(config.APP_RUNNING_PORT, () => {
        logger.info(`server started on port ${config.APP_RUNNING_PORT} (${config.NODE_ENV})`);
    });
}

module.exports = app;
