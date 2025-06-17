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

    // Validate input ObjectIds
    if (!mongoose.Types.ObjectId.isValid(data.fromOffice)) {
      throw new Error('Invalid fromOffice ID');
    }

    if (!mongoose.Types.ObjectId.isValid(data.toOffice)) {
      throw new Error('Invalid toOffice ID');
    }

    // Check branch validity
    const [fromBranch, toBranch] = await Promise.all([
      Branch.findOne({ _id: data.fromOffice, operatorId, status: 'Active' }),
      Branch.findOne({ _id: data.toOffice, operatorId, status: 'Active' }),
    ]);

    if (!fromBranch) throw new Error('Invalid or inactive origin branch');
    if (!toBranch) throw new Error('Invalid or inactive destination branch');
    if (data.fromOffice === data.toOffice) {
      throw new Error('Origin and destination branches cannot be the same');
    }

    // Create booking
    const booking = new Booking({
      ...data,
      operatorId,
      bookedBy: userId,
      createdBy: userId,
    });

    // Set bookingDate
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    booking.bookingDate = `${year}-${month}-${day}`;

    // Generate bookingId
    const operator = await Operator.findByIdAndUpdate(
      operatorId,
      { $inc: { bookingSequence: 1 } },
      { new: true, useFindAndModify: false }
    );
    if (!operator) throw new Error('Operator not found');

    const sequenceStr = operator.bookingSequence.toString().padStart(4, '0');
    const typeCode = booking.lrType === 'Paid' ? 'P' : 'TP';
    const dateStr = `${year}${month}${day}`;
    booking.bookingId = `${typeCode}-${dateStr}-${sequenceStr}`;

    // Update user cargo balance if needed
    if (booking.lrType === 'Paid') {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      user.cargoBalance = (user.cargoBalance || 0) + booking.totalAmountCharge;
      await user.save();
    }

    await booking.save();

    // Populate before returning
    const populatedBooking = await Booking.findById(booking._id)
      .populate('fromOffice', '_id name')
      .populate('toOffice', '_id name')
      .populate('assignedVehicle', '_id vehicleNumber');

    const result = populatedBooking.toObject();

    if (result.assignedVehicle) {
      result.assignedVehicle = {
        _id: result.assignedVehicle._id,
        vehicleNumber: result.assignedVehicle.vehicleNumber,
      };
    }

    logger.info('Booking created successfully', {
      bookingId: result.bookingId
    });

    return result;

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
    logger.info('Fetching all bookings', { operatorId });
    
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

      logger.info('Successfully fetched all bookings', { 
        totalCount, 
        todayCount,
        operatorId 
      });

      return { bookings, totalCount, todayCount };
    } catch (error) {
      logger.error('Error getting all bookings', { 
        error: error.message, 
        operatorId,
        stack: error.stack 
      });
      throw error;
    }
  }

  static async getBookingById(id, operatorId) {
    logger.info('Fetching booking by ID', { bookingId: id, operatorId });
    
    try {
      const booking = await Booking.findOne({ _id: id, operatorId })
        .populate('fromOffice', '_id name')
        .populate('toOffice', '_id name')
        .populate('assignedVehicle', '_id vehicleNumber')
        .populate('bookedBy', '_id fullName');

      if (!booking) {
        logger.warn('Booking not found', { bookingId: id, operatorId });
        throw new Error('Booking not found');
      }

      logger.debug('Successfully fetched booking', { 
        bookingId: id,
        status: booking.status,
        operatorId 
      });

      return {
        ...booking.toObject(),
        senderName: booking.assignedVehicle?.vehicleNumber || "Assign vehicleNumber"
      };
    } catch (error) {
      logger.error('Error getting booking by ID', { 
        error: error.message, 
        bookingId: id, 
        operatorId,
        stack: error.stack 
      });
      throw error;
    }
  }

  static async updateBooking(id, updateData, operatorId) {
    logger.info('Updating booking', { 
      bookingId: id, 
      operatorId,
      updateFields: Object.keys(updateData)
    });
    
    try {
      const booking = await Booking.findOneAndUpdate(
        { _id: id, operatorId },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
      
      if (!booking) {
        logger.warn('Booking not found for update', { bookingId: id, operatorId });
        throw new Error('Booking not found');
      }
      
      logger.info('Successfully updated booking', { 
        bookingId: id, 
        status: booking.status,
        operatorId 
      });
      
      return booking;
    } catch (error) {
      logger.error('Error updating booking', { 
        error: error.message, 
        bookingId: id, 
        operatorId,
        stack: error.stack 
      });
      throw error;
    }
  }

  static async deleteBooking(id, operatorId) {
    logger.info('Deleting booking', { bookingId: id, operatorId });
    
    try {
      const booking = await Booking.findOneAndDelete({ _id: id, operatorId });
      if (!booking) {
        logger.warn('Booking not found for deletion', { bookingId: id, operatorId });
        throw new Error('Booking not found');
      }
      
      logger.info('Successfully deleted booking', { bookingId: id, operatorId });
      return { message: 'Booking deleted' };
    } catch (error) {
      logger.error('Error deleting booking', { 
        error: error.message, 
        bookingId: id, 
        operatorId,
        stack: error.stack 
      });
      throw error;
    }
  }
  
  static async getUnassignedBookings(operatorId, page = 1, limit = 10, query = "") {
    logger.info('Fetching unassigned bookings', { 
      operatorId, 
      page, 
      limit, 
      query: query || 'none' 
    });
    
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
        logger.debug('Applied search filter', { filter: baseFilter.$or });
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

    const result = {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
    };

    logger.info('Successfully fetched unassigned bookings', { 
      total,
      returned: bookings.length,
      operatorId,
      page,
      totalPages: result.totalPages 
    });

    return result;
  } catch (error) {
    logger.error('Error getting unassigned bookings', {
      error: error.message,
      operatorId,
      page,
      limit,
      query: query || 'none',
      stack: error.stack
    });
    throw error;
  }
}

  static async getAssignedBookings(operatorId, currentUserId, page = 1, limit = 10, query = "") {
    logger.info('Fetching assigned bookings', { 
      operatorId, 
      currentUserId,
      page, 
      limit, 
      query: query || 'none' 
    });
    
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
        logger.debug('Applied search filter', { filter: baseFilter.$or });
      }

    // Update all matching bookings to 'InTransit' if not already
    const updateResult = await Booking.updateMany(
      { ...baseFilter, status: { $ne: 'InTransit' } },
      {
        $set: {
          status: 'InTransit',
          loadedBy: currentUserId,
          updatedBy: currentUserId,
          updatedAt: new Date()
        },
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      logger.info('Updated bookings status to InTransit', {
        count: updateResult.modifiedCount,
        operatorId,
        updatedBy: currentUserId
      });
    }

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

    const result = {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
    };

    logger.info('Successfully fetched assigned bookings', { 
      total,
      returned: bookings.length,
      operatorId,
      page,
      totalPages: result.totalPages,
      updatedToInTransit: updateResult?.modifiedCount || 0
    });

    return result;
  } catch (error) {
    logger.error('Error getting assigned bookings', {
      error: error.message,
      operatorId,
      currentUserId,
      page,
      limit,
      query: query || 'none',
      stack: error.stack
    });
    throw error;
  }
}

  static async getInTransitBookings(operatorId, page = 1, limit = 10, query = "") {
    logger.info('Fetching in-transit bookings', { 
      operatorId, 
      page, 
      limit, 
      query: query || 'none' 
    });
    
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
        logger.debug('Applied search filter', { filter: baseFilter.$or });
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

    const result = {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
    };

    logger.info('Successfully fetched in-transit bookings', { 
      total,
      returned: bookings.length,
      operatorId,
      page,
      totalPages: result.totalPages 
    });

    return result;
  } catch (error) {
    logger.error('Error getting in-transit bookings', {
      error: error.message,
      operatorId,
      page,
      limit,
      query: query || 'none',
      stack: error.stack
    });
    throw error;
  }
}


  static async getArrivedBookings(operatorId, page = 1, limit = 10, query = "") {
    logger.info('Fetching arrived bookings', { 
      operatorId, 
      page, 
      limit, 
      query: query || 'none' 
    });
    
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
        logger.debug('Applied search filter', { filter: baseFilter.$or });
      }

    logger.info('Fetching arrived bookings with filter:', baseFilter);

    const [total, rawBookings] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.find(baseFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('fromOffice', '_id name')
        .populate('toOffice', '_id name')
        .populate('assignedVehicle', '_id vehicleNumber')
        .populate('operatorId', '_id name')
    ]);
    
    logger.debug('Fetched arrived bookings', { total, limit, skip });

    const formattedBookings = rawBookings.map(b => {
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

    const result = {
      bookings: formattedBookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: formattedBookings.length,
    };

    logger.info('Successfully fetched arrived bookings', { 
      total,
      returned: formattedBookings.length,
      operatorId,
      page,
      totalPages: result.totalPages 
    });

    return result;
  } catch (error) {
    logger.error('Error fetching arrived bookings', {
      error: error.message,
      operatorId,
      page,
      limit,
      query: query || 'none',
      stack: error.stack
    });
    throw error;
  }
}

  static async searchBookings({ operatorId, limit = 10, page = 1, query = "", status = "" }) {
    logger.info('Searching bookings', { 
      operatorId, 
      query: query || 'none', 
      status: status || 'all',
      page,
      limit
    });
    
    try {
      const mongoQuery = { operatorId };

    if (query.trim()) {
      const regex = new RegExp(query.trim(), "i");
      mongoQuery.$or = [
        { bookingId: regex },
        { senderName: regex },
        { receiverName: regex },
      ];
    }

    if (status.trim()) {
      // Case-insensitive exact match for status using regex
      const statusRegex = new RegExp(`^${status.trim()}$`, "i");
      mongoQuery.status = statusRegex;
    }

    console.log("MongoDB query:", JSON.stringify(mongoQuery, null, 2));

      const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(mongoQuery),
      Booking.find(mongoQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate({ path: "fromOffice", select: "_id name" })
        .populate({ path: "toOffice", select: "_id name" })
        .populate({ path: "assignedVehicle", select: "_id vehicleNumber" }),
    ]);

    const formattedBookings = bookings.map((booking) => {
      const b = booking.toObject();
      if (b.assignedVehicle?.vehicleNumber) {
        b.assignedVehicle = {
          _id: b.assignedVehicle._id,
          assignedVehicle: b.assignedVehicle.vehicleNumber,
        };
      }
      return b;
    });

      const result = {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        bookings: formattedBookings,
      };

      logger.debug('Booking search completed', { 
        totalResults: total,
        returnedResults: formattedBookings.length,
        operatorId 
      });

      return result;
    } catch (error) {
      logger.error('Error searching bookings', { 
        error: error.message, 
        operatorId,
        query,
        status,
        stack: error.stack 
      });
      throw error;
    }
  }
}

module.exports = BookingService;

