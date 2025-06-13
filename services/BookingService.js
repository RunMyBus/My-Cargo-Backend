const Booking = require('../models/Booking');
const User = require('../models/User');
const logger = require('../utils/logger');

const BookingService = {
  async createBooking(data, userId) {
    try {
      logger.info('Booking creation request received', { 
        userId,
        bookingData: data
      });

      const booking = new Booking(data);

      // Get today's date parts for bookingDate and bookingId prefix
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const day = pad(now.getDate());

      // Set bookingDate in YYYY-MM-DD format
      booking.bookingDate = `${year}-${month}-${day}`;

      // Construct bookingId prefix: type letter + YYYYMMDD
      const typeCode = booking.type === 'Paid' ? 'P' : 'TP';
      const dateStr = `${year}${month}${day}`;
      const prefix = `${typeCode}${dateStr}`;

      // Find last bookingId with this prefix (type + date) to get sequence number
      const regex = new RegExp(`^${prefix}(\\d{3})$`);
      const lastBooking = await Booking.findOne({ bookingId: { $regex: regex } })
        .sort({ bookingId: -1 })
        .exec();

      let sequence = 1;
      if (lastBooking && lastBooking.bookingId) {
        const lastSeq = parseInt(lastBooking.bookingId.slice(-3), 10);
        sequence = lastSeq + 1;
      }

      const sequenceStr = sequence.toString().padStart(3, '0');
      booking.bookingId = `${prefix}${sequenceStr}`;  // e.g. P20250609001

      // Update user's cargo balance if type is 'Paid'
      if (booking.type === 'Paid') {
        const user = await User.findById(userId);
        if (!user) {
          logger.error('User not found when updating cargo balance', {
            userId,
            bookingId: booking.bookingId
          });
          throw new Error('User not found');
        }

        user.cargoBalance = user.cargoBalance || 0;
        user.cargoBalance += booking.totalAmount;
        await user.save();

        logger.info('Cargo balance updated', {
          userId: user._id,
          newBalance: user.cargoBalance,
          amountAdded: booking.totalAmount,
          bookingId: booking.bookingId
        });
      }

      await booking.save();

      logger.info('Booking created successfully', { 
        bookingId: booking.bookingId
      });

      return booking;
    } catch (error) {
      logger.error('Error creating booking', { 
        error: error.message,
        stack: error.stack,
        bookingData: data
      });
      throw error;
    }
  }
};

module.exports = BookingService;