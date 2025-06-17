const express = require('express');
const router = express.Router();
const passport = require('passport');
const bookingController = require('../controllers/bookingController');

router.use(passport.authenticate('jwt', { session: false }));

// Create booking
router.post('/', bookingController.createBooking);

// Fixed routes first (non-id params)
router.get('/export/bookings', bookingController.exportBookings);
router.get('/export/unassigned', bookingController.exportUnassignedBookings);
router.get('/export/arrived', bookingController.exportArrivedBookings);
router.get('/export/in-transit', bookingController.exportInTransitBookings);
//router.get('/cargoBalance', bookingController.getCargoBalancePerDay);
router.get('/all', bookingController.getAllBookings);
router.post('/unassigned', bookingController.getUnassignedBookings);
router.post('/assigned', bookingController.getAssignedBookings);
router.post('/in-transit', bookingController.getInTransitBookings);
router.post('/arrived', bookingController.getArrivedBookings);
router.post('/search', bookingController.searchBookings);

// Dynamic routes (with :id) last
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
