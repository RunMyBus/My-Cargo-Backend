const express = require('express');
const router = express.Router();
const passport = require('passport');
const bookingController = require('../controllers/bookingController');

router.use(passport.authenticate('jwt', { session: false }));

router.post('/', bookingController.createBooking);
router.get('/all', bookingController.getAllBookings);
router.get('/unassigned', bookingController.getUnassignedBookings);
router.post('/search', bookingController.searchBookingsPost);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
