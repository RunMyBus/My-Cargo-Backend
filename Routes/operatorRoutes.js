const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const passport = require('passport');

router.use(passport.authenticate('jwt', { session: false }));

// Create a new operator
router.post('/create', operatorController.createOperator);

// Get all operators
router.get('/', operatorController.getAllOperators);

// Search operators
router.post('/search', operatorController.searchOperators);

module.exports = router;
