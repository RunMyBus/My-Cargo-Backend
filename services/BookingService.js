const Booking = require('../models/Booking');
const User = require('../models/User');
const Branch = require('../models/Branch');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { request } = require('express');
const Operator = require('../models/Operator');

class BookingService {
  static async createBooking(data, userId, operatorId) {
    try {
      logger.info('Booking creation request received', { 
        userId,
        bookingData: data
      });

      // Validate branch offices
      const [fromBranch, toBranch] = await Promise.all([
        Branch.findOne({ _id: data.fromOffice, operatorId, status: 'Active' }),
        Branch.findOne({ _id: data.toOffice, operatorId, status: 'Active' })
      ]);

      if (!fromBranch) {
        throw new Error('Invalid or inactive origin branch');
      }
      if (!toBranch) {
        throw new Error('Invalid or inactive destination branch');
      }
      if (data.fromOffice.toString() === data.toOffice.toString()) {
        throw new Error('Origin and destination branches cannot be the same');
      }

      const booking = new Booking({
        ...data,
        operatorId,
        createdBy: userId,
        bookedBy: userId,
        senderName: data.senderName,
        senderPhone: data.senderPhone,
        senderEmail: data.senderEmail,
        senderAddress: data.senderAddress,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone, 
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
      const operator = await Operator.findByIdAndUpdate(
        operatorId,
        { $inc: { bookingSequence: 1 } },
        { new: true, useFindAndModify: false }
      );

      if (!operator) {
        throw new Error('Operator not found');
      }

      // Construct bookingId using operator code and sequence
      const sequenceStr = operator.bookingSequence.toString().padStart(4, '0');
      const typeCode = booking.lrType === 'Paid' ? 'P' : 'TP';
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
        user.cargoBalance += booking.totalAmountCharge;
        await user.save();

        logger.info('Cargo balance updated', {
          userId: user._id,
          newBalance: user.cargoBalance,
          amountAdded: booking.totalAmountCharge,
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
          .populate('assignedVehicle', 'vehicleNumber'),
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
  
  static async getUnassignedBookings(operatorId, page = 1, limit = 10, query = "") {
  try {
    const skip = (page - 1) * limit;

    const baseFilter = {
      operatorId,
      assignedVehicle: null,
    };

    if (query?.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      baseFilter.$or = [
        { bookingId: regex },
        { senderName: regex },
        { receiverName: regex },
      ];
    }

    const [total, rawBookings] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.find(baseFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('fromOffice', 'name')
        .populate('toOffice', 'name')
        .populate('bookedBy', '_id')
        .populate('operatorId', '_id')
        .populate('assignedVehicle', '_id vehicleNumber')
    ]);

    // Format bookings
    const bookings = rawBookings.map(b => {
      const bookingObj = b.toObject();

      // bookedBy as string _id or null
      bookingObj.bookedBy = b.bookedBy?._id?.toString() || null;

      // operatorId as string _id or null
      bookingObj.operatorId = b.operatorId?._id?.toString() || null;

      // assignedVehicle as simplified object or null
      bookingObj.assignedVehicle = b.assignedVehicle
        ? {
            _id: b.assignedVehicle._id.toString(),
            vehicleNumber: b.assignedVehicle.vehicleNumber,
          }
        : null;

      return bookingObj;
    });

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
    };
  } catch (error) {
    logger.error('Error getting unassigned bookings', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

static async getAssignedBookings(operatorId, currentUserId, page = 1, limit = 10, query = "") {
  try {
    const skip = (page - 1) * limit;

    const baseFilter = {
      operatorId,
      assignedVehicle: { $ne: null },
    };

    if (query?.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      baseFilter.$or = [
        { bookingId: regex },
        { senderName: regex },
        { receiverName: regex },
      ];
    }

    // Update all matching bookings to 'InTransit' if not already
    await Booking.updateMany(
      { ...baseFilter, status: { $ne: 'InTransit' } },
      {
        $set: {
          status: 'InTransit',
          loadedBy: currentUserId,
          updatedBy: currentUserId,
        },
      }
    );

    const [total, rawBookings] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.find(baseFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('fromOffice', '_id name')
        .populate('toOffice', '_id name')
        .populate('operatorId', '_id')
        .populate('assignedVehicle', '_id vehicleNumber')
    ]);

    const bookings = rawBookings.map(b => {
      const booking = b.toObject();

      booking.bookedBy = b.bookedBy ? b.bookedBy.toString() : null;

      booking.operatorId = b.operatorId?._id?.toString() || null;

      booking.assignedVehicle = b.assignedVehicle
        ? {
            _id: b.assignedVehicle._id.toString(),
            vehicleNumber: b.assignedVehicle.vehicleNumber,
          }
        : null;

      return booking;
    });

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
    };
  } catch (error) {
    logger.error('Error getting assigned bookings', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

static async getInTransitBookings(operatorId, page = 1, limit = 10, query = "") {
  try {
    const skip = (page - 1) * limit;

    const baseFilter = {
      status: 'InTransit',
      operatorId
    };

    if (query?.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      baseFilter.$or = [
        { bookingId: regex },
        { senderName: regex },
        { receiverName: regex }
      ];
    }

    const [total, rawBookings] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.find(baseFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('fromOffice', '_id name')
        .populate('toOffice', '_id name')
        .populate('assignedVehicle', '_id vehicleNumber')
        .populate('operatorId', '_id')
        .populate('loadedBy', '_id')
        .populate('unloadedBy', '_id')
        .populate('deliveredBy', '_id')
    ]);

    const bookings = rawBookings.map(b => {
      const booking = b.toObject();

      booking.bookedBy = b.bookedBy ? b.bookedBy.toString() : null;
      booking.operatorId = b.operatorId?._id?.toString() || null;

      booking.assignedVehicle = b.assignedVehicle
        ? {
            _id: b.assignedVehicle._id.toString(),
            vehicleNumber: b.assignedVehicle.vehicleNumber,
          }
        : null;

      // Include loadedBy, unloadedBy, deliveredBy as ObjectId strings
      booking.loadedBy = b.loadedBy ? b.loadedBy._id.toString() : null;
      booking.unloadedBy = b.unloadedBy ? b.unloadedBy._id.toString() : null;
      booking.deliveredBy = b.deliveredBy ? b.deliveredBy._id.toString() : null;

      return booking;
    });

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
    };
  } catch (error) {
    logger.error('Error getting in-transit bookings', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}


static async getArrivedBookings(operatorId, page = 1, limit = 10, query = "") {
  try {
    const skip = (page - 1) * limit;

    const opId = mongoose.Types.ObjectId.isValid(operatorId)
      ? new mongoose.Types.ObjectId(operatorId)
      : operatorId;

    const baseFilter = {
      status: 'Arrived',
      operatorId: opId
    };

    if (query?.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      baseFilter.$or = [
        { bookingId: regex },
        { senderName: regex },
        { receiverName: regex }
      ];
    }

    console.log('baseFilter:', baseFilter);

    const [total, rawBookings] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.find(baseFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('fromOffice', '_id name')
        .populate('toOffice', '_id name')
        .populate('assignedVehicle', '_id vehicleNumber')
        // .populate('bookedBy', '_id')  <--- removed this populate
        .populate('operatorId', '_id name')
    ]);

    console.log(`Found ${total} bookings`);

    const formattedBookings = rawBookings.map(b => {
      const booking = b.toObject();

      // bookedBy direct ObjectId string from DB field, no populate needed
      booking.bookedBy = b.bookedBy ? b.bookedBy.toString() : null;

      booking.operatorId = b.operatorId?._id?.toString() || null;

      booking.assignedVehicle = b.assignedVehicle
        ? {
            _id: b.assignedVehicle._id.toString(),
            vehicleNumber: b.assignedVehicle.vehicleNumber,
          }
        : null;

      return booking;
    });

    return {
      bookings: formattedBookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: formattedBookings.length,
    };
  } catch (error) {
    console.error('Error in BookingService.getArrivedBookings:', error);
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
