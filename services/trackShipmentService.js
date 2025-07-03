const Booking = require('../models/Booking');
const logger = require('../utils/logger');
//const STATIC_OTP = '123456';

class TrackShipmentService {
  static formatDate(date) {
    return date ? new Date(date).toLocaleString() : 'N/A';
  }

  static formatOnlyDate(date) {
    return date ? new Date(date).toISOString().split('T')[0] : '';
  }

  /**
   * Get all bookings associated with a phone number
   */
  static async getBookingsByPhone(phone, otp) {
    logger.info('Fetching bookings by phone', { phone });

    try {
      if (otp !== process.env.STATIC_OTP) {
        const error = new Error('Invalid OTP');
        error.statusCode = 401;
        throw error;
      }

      const bookings = await Booking.find({
        $or: [{ senderPhone: phone }, { receiverPhone: phone }],
      })
        .select('bookingId bookingDate senderName receiverName status')
        .sort({ createdAt: -1 });

      return bookings.map((b) => ({
        bookingId: b.bookingId,
        bookingDate: b.bookingDate,
        senderName: b.senderName,
        receiverName: b.receiverName,
        toOffice: b.toOffice,
        status: b.status,
      }));
    } catch (error) {
      logger.error('Failed to fetch bookings by phone', {
        error: error.message,
        phone,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get tracking details by booking ID
   */
  static async getTrackByBookingId(bookingId) {
    logger.info('Fetching tracking info', { bookingId });

    if (!bookingId) {
      const err = new Error('bookingId is required');
      err.statusCode = 400;
      throw err;
    }

    const booking = await Booking.findOne({ bookingId })
      .populate('bookedBy', 'fullName')
      .populate('eventHistory.user', 'fullName')
      .populate('eventHistory.vehicle', 'vehicleNumber')
      .populate('eventHistory.branch', 'name')
      .populate('fromOffice toOffice', 'name')
      .populate('assignedVehicle', 'vehicleNumber');

    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const tracking = [];

    const getName = (user) => user?.fullName || 'Unknown';
    const getBranch = (branch) => branch?.name || 'Unknown';
    const getVehicle = (vehicle) => vehicle?.vehicleNumber || 'N/A';

    // Always add Booked status (from bookedBy and bookingDate)
    tracking.push({
      status: 'Booked',
      date: this.formatDate(booking.createdAt),
      info: `booked by ${getName(booking.bookedBy)} at ${getBranch(booking.fromOffice)}`
    });

    // Loop over eventHistory for other events
    for (const event of booking.eventHistory) {
      // Capitalize first letter of type
      const statusCapitalized = event.type.charAt(0).toUpperCase() + event.type.slice(1);

      let info = `${statusCapitalized} by ${getName(event.user)}`;
      if (event.branch) info += ` at ${getBranch(event.branch)}`;
      if (event.vehicle) info += ` using vehicle ${getVehicle(event.vehicle)}`;

      tracking.push({
        status: statusCapitalized,
        date: this.formatDate(event.date),
        info,
      });
    }

    // Add Delivered event manually if booking.status = Delivered but no delivered event in eventHistory
    if (booking.status === 'Delivered' && !booking.eventHistory.some(e => e.type === 'delivered')) {
      tracking.push({
        status: 'Delivered',
        date: this.formatDate(booking.updatedAt),
        info: `Delivered by ${getName(booking.bookedBy)} at ${getBranch(booking.toOffice)}`
      });
    }

    return {
      bookingId: booking.bookingId,
      bookedDate: this.formatOnlyDate(booking.bookingDate),
      totalAmount: booking.totalAmountCharge?.toString() || '',
      receiverName: booking.receiverName || '',
      tracking
    };
  }
}

module.exports = TrackShipmentService;
