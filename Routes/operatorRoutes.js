const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const passport = require('passport');

router.use(passport.authenticate('jwt', { session: false }));

// Create a new operator
router.post('/create', operatorController.createOperator);

// Get all operators
router.get('/', operatorController.getAllOperators);

// Update an operator
router.put('/:id', operatorController.updateOperator);

// Delete an operator
router.delete('/:id', operatorController.deleteOperator);

// Search operators
router.post('/search', operatorController.searchOperators);

module.exports = router;
