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
      .populate('bookedBy loadedBy unloadedBy deliveredBy cancelledBy', 'fullName')
      .populate('fromOffice toOffice', 'name')
      .populate('assignedVehicle', 'vehicleNumber');

    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const tracking = [];

    const getName = (user) => user?.fullName || 'Unknown';
    const getBranch = (office) => office?.name || 'Unknown';
    const getVehicle = (vehicle) => vehicle?.vehicleNumber || 'N/A';

    // Booked
    tracking.push({
      bookingStatus: 'Booked',
      bookingDate: this.formatDate(booking.createdAt),
      bookingInfo: `booked by ${getName(booking.bookedBy)} at ${getBranch(booking.fromOffice)}`
    });

    // Loaded
    if (booking.loadedBy) {
      tracking.push({
        loadingStatus: 'Loaded',
        loadingDate: this.formatDate(booking.updatedAt),
        loadingInfo: `loaded by ${getName(booking.loadedBy)} at ${getBranch(booking.fromOffice)} to vehicle ${getVehicle(booking.assignedVehicle)}`
      });
    }

    // Unloaded
    if (booking.unloadedBy) {
      tracking.push({
        unloadingStatus: 'Unloaded',
        unloadingDate: this.formatDate(booking.updatedAt),
        unloadingInfo: `unloaded by ${getName(booking.unloadedBy)} at ${getBranch(booking.toOffice)}`
      });
    }

    // Delivered
    if (booking.deliveredBy) {
      tracking.push({
        deliveryStatus: 'Delivered',
        deliveryDate: this.formatDate(booking.updatedAt),
        deliveryInfo: `delivered by ${getName(booking.deliveredBy)} at ${getBranch(booking.toOffice)}`
      });
    }

    // Cancelled
    if (booking.cancelledBy) {
      tracking.push({
        cancelStatus: 'Cancelled',
        cancelDate: this.formatDate(booking.updatedAt),
        cancelInfo: `cancelled by ${getName(booking.cancelledBy)}`
      });
    }

    return {
      bookingId: booking.bookingId,
      bookedDate: this.formatOnlyDate(booking.bookingDate),
      totalAmount: booking.totalAmountCharge?.toString() || '',
      reciverName: booking.receiverName || '',
      tracking
    };
  }
}

module.exports = TrackShipmentService;
