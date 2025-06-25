// Router/cashTransferRoutes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const cashTransferController = require('../controllers/cashTransferController');

router.use(passport.authenticate('jwt', { session: false }));

// Get all cash transfers for the current operator
router.get('/', cashTransferController.getCashTransfers);

// Export all pending cash transfers 
router.get('/exportPending', cashTransferController.exportPendingTransfers);

// Get a single cash transfer by ID
router.get('/:id', cashTransferController.getCashTransferById);

// Create a new cash transfer request
router.post('/', cashTransferController.createCashTransfer);


// Update cash transfer status (approve/reject)
router.put('/status/:id', cashTransferController.updateCashTransferStatus);

// Update pending cash transfer (amount/description)
router.put('/:id', cashTransferController.updateCashTransfer);

// Delete a cash transfer
router.delete('/:id', cashTransferController.deleteCashTransfer);

module.exports = router;