const express = require('express');
const router = express.Router();
const trackShipmentController = require('../controllers/trackShipmentController');

router.post('/phone', trackShipmentController.getBookingsByPhoneNo);
router.post('/bookingId', trackShipmentController.getTrackingByBookingId);

module.exports = router;
