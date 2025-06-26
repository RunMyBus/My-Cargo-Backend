const TrackShipmentService = require('../services/trackShipmentService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/bookings/by-phone
 * @desc    Get all bookings by sender/receiver phone number
 * @access  Public (OTP based)
 */
exports.getBookingsByPhoneNo = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const bookings = await TrackShipmentService.getBookingsByPhone(phone, otp);

    res.status(200).json({ bookings });
  } catch (error) {
    logger.error('Error in getBookingsByPhone controller', {
      error: error.message,
      phone: req.body.phone,
      stack: error.stack,
    });

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Server error' : error.message;
    res.status(statusCode).json({ message });
  }
};

/**
 * @route   POST /api/bookings/tracking
 * @desc    Get tracking information for a booking
 * @access  Public
 */
exports.getTrackingByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    const trackingData = await TrackShipmentService.getTrackByBookingId(bookingId);

    res.status(200).json(trackingData);
  } catch (error) {
    logger.error('Error in getTrackingByBookingId controller', {
      error: error.message,
      bookingId: req.body.bookingId,
      stack: error.stack,
    });

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Server error' : error.message;
    res.status(statusCode).json({ message });
  }
};
