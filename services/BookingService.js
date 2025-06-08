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
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      booking.bookingDate = `${year}-${month}-${day}`;
      const sequence = (await Booking.countDocuments({bookingDate:booking.bookingDate})).toString().padStart(4, '0');
      booking.bookingId = `${year}-${month}-${day}-${booking.type === 'paid' ? 'P' : 'TP'}${sequence}`;
      // If booking type is paid, update user's cargo balance
      if (booking.type === 'paid') {
        const user = await User.findById(userId);
        if (!user) {
          logger.error('User not found when updating cargo balance', {
            userId,
            bookingId: bookingId
          });
          throw new Error('User not found');
        }

        // Update user's cargo balance
        user.cargoBalance = user.cargoBalance || 0;
        user.cargoBalance += booking.totalAmount;
        await user.save();

        // Log cargo balance update
        logger.info('Cargo balance updated', {
          userId: user._id,
          newBalance: user.cargoBalance,
          amountAdded: booking.totalAmount,
          bookingId: bookingId
        });
      }

      await booking.save();

      // Log successful booking creation
      logger.info('Booking created successfully', { 
        bookingId: bookingId
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
