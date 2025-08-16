const express = require('express');
const router = express.Router();
const RazorPayController = require('../controllers/razorPayController');

const passport = require('passport');

router.post('/webhooks/receive/', RazorPayController.handleWebhook);

router.use(passport.authenticate('jwt', { session: false }));

// Razorpay Routes
router.post('/generate-qr/:bookingId', RazorPayController.generateQRCode);

module.exports = router;
