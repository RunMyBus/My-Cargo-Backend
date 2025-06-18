const express = require('express');
const router = express.Router();
const chartController = require('../controllers/chartController');
const passport = require('passport');

// Require JWT authentication for all role routes
router.use(passport.authenticate('jwt', { session: false }));

router.get('/todayBookings', chartController.getTodayBookingsByPayment);
router.get('/branchBookings', chartController.getBookingsByBranchAndPayment);
router.get('/sixMonthBookings', chartController.getSixMonthBookings);
router.get('/pendingBookingsByBranch', chartController.getPendingBookingsByBranch);

module.exports = router;