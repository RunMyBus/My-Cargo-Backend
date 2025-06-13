const Booking = require('../models/Booking');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class BookingService {
  static async createBooking(data, userId, operatorId) {
    try {
      logger.info('Booking creation request received', { 
        userId,
        bookingData: data
      });

      const booking = new Booking({
        ...data,
        operatorId,
        createdBy: userId
      });

      // Get today's date parts for bookingDate and bookingId prefix
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const day = pad(now.getDate());

      // Set bookingDate in YYYY-MM-DD format
      booking.bookingDate = `${year}-${month}-${day}`;

      // Get operator and increment booking sequence
      const operator = await mongoose.model('operator').findByIdAndUpdate(
        operatorId,
        { $inc: { bookingSequence: 1 } },
        { new: true, useFindAndModify: false }
      );

      if (!operator) {
        throw new Error('Operator not found');
      }

      // Construct bookingId using operator code and sequence
      const sequenceStr = operator.bookingSequence.toString().padStart(4, '0');
      const typeCode = booking.type === 'Paid' ? 'P' : 'TP';
      const dateStr = `${year}${month}${day}`;
      const bookingId = `${typeCode}-${dateStr}-${sequenceStr}`;
      booking.bookingId = bookingId;  // e.g. P-20250609-001

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

  static async getAllBookings(operatorId) {
    try {
      const [bookings, totalCount] = await Promise.all([
        Booking.find({ operatorId })
          .populate('fromOffice', 'name')
          .populate('toOffice', 'name')
          .populate('assignedVehicle', 'name number'),
        Booking.countDocuments({ operatorId })
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayCount = await Booking.countDocuments({
        operatorId,
        createdAt: { $gte: todayStart },
      });

      return { bookings, totalCount, todayCount };
    } catch (error) {
      logger.error('Error getting all bookings', { error: error.message });
      throw error;
    }
  }

  static async getUnassignedBookings(operatorId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const query = { operatorId, assignedVehicle: null };

      const [total, bookings] = await Promise.all([
        Booking.countDocuments(query),
        Booking.find(query)
          .skip(skip)
          .limit(limit)
          .populate('fromOffice', 'name')
          .populate('toOffice', 'name')
          .populate('assignedVehicle', 'name number')
      ]);

      return {
        bookings,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        count: bookings.length,
      };
    } catch (error) {
      logger.error('Error getting unassigned bookings', { error: error.message });
      throw error;
    }
  }

  static async getBookingById(id, operatorId) {
    try {
      const booking = await Booking.findOne({ _id: id, operatorId })
        .populate('fromOffice', '_id name')
        .populate('toOffice', '_id name')
        .populate('assignedVehicle', '_id vehicleNumber');

      if (!booking) {
        throw new Error('Booking not found');
      }

      return {
        ...booking.toObject(),
        senderName: booking.assignedVehicle?.vehicleNumber || "Assign vehicleNumber"
      };
    } catch (error) {
      logger.error(`Error getting booking by id: ${id}`, { error: error.message });
      throw error;
    }
  }

  static async updateBooking(id, updateData, operatorId) {
    try {
      const booking = await Booking.findOneAndUpdate(
        { _id: id, operatorId },
        updateData,
        { new: true }
      );
      if (!booking) {
        throw new Error('Booking not found');
      }
      return booking;
    } catch (error) {
      logger.error(`Error updating booking: ${id}`, { error: error.message });
      throw error;
    }
  }

  static async deleteBooking(id, operatorId) {
    try {
      const booking = await Booking.findOneAndDelete({ _id: id, operatorId });
      if (!booking) {
        throw new Error('Booking not found');
      }
      return { message: 'Booking deleted' };
    } catch (error) {
      logger.error(`Error deleting booking: ${id}`, { error: error.message });
      throw error;
    }
  }

  static async searchBookings({ operatorId, limit = 10, page = 1, query = "", status = "" }) {
    try {
      const mongoQuery = { operatorId };

      if (query && query.trim() !== "") {
        mongoQuery.$or = [
          { bookingId: { $regex: query.trim(), $options: "i" } },
          { senderName: { $regex: query.trim(), $options: "i" } },
          { receiverName: { $regex: query.trim(), $options: "i" } },
        ];
      }

      if (status && status.trim() !== "") {
        mongoQuery.status = status.trim();
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [total, bookings] = await Promise.all([
        Booking.countDocuments(mongoQuery),
        Booking.find(mongoQuery)
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 })
          .populate({ path: 'fromOffice', select: '_id name' })
          .populate({ path: 'toOffice', select: '_id name' })
          .populate({ path: 'assignedVehicle', select: '_id vehicleNumber' })
      ]);

      const formattedBookings = bookings.map(booking => {
        const b = booking.toObject();
        if (b.assignedVehicle) {
          b.assignedVehicle = {
            _id: b.assignedVehicle._id,
            assignedVehicle: b.assignedVehicle.vehicleNumber
          };
        }
        return b;
      });

      return {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        bookings: formattedBookings,
      };
    } catch (error) {
      logger.error('Error searching bookings', { error: error.message });
      throw error;
    }
  }
}

module.exports = BookingService;
