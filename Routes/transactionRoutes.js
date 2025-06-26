// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const passport = require('passport');

router.use(passport.authenticate('jwt', { session: false }));

router.post('/', transactionController.getUserTransactions);

module.exports = router;
