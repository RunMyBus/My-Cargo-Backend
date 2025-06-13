const BookingService = require('../services/BookingService');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const booking = await BookingService.createBooking(req.body, req.user._id);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all bookings
 * @returns {Promise<Object>} JSON object with bookings and stats
 * @property {Booking[]} bookings - Array of bookings
 * @property {Number} totalCount - Total number of bookings
 * @property {Number} todayCount - Number of bookings created today
 */
exports.getAllBookings = async (req, res) => {
  try {
    // Get all bookings
    const bookings = await Booking.find()
      .populate('fromOffice', 'name') // Only _id and name
      .populate('toOffice', 'name')
      .populate('assignedVehicle', 'name number'); // Example fields

    // Get total count of bookings
    const totalCount = await Booking.countDocuments();

    // Get count of bookings created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await Booking.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // Return JSON object with bookings and stats
    res.json({
      bookings,
      totalCount,
      todayCount,
    });
  } catch (err) {
    // Internal Server Error
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getUnassignedBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments({ assignedVehicle: null });

    const bookings = await Booking.find({ assignedVehicle: null })
      .skip(skip)
      .limit(limit)
      .populate('fromOffice', 'name') // Only _id and name
      .populate('toOffice', 'name')
      .populate('assignedVehicle', 'name number'); // Example fields

    res.json({
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('fromOffice', '_id name')
      .populate('toOffice', '_id name')
      .populate('assignedVehicle', '_id vehicleNumber');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const formattedBooking = {
      ...booking.toObject(),
      senderName: booking.assignedVehicle?.vehicleNumber || "Assign vehicleNumber"
    };

    res.json(formattedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Update booking by ID (including status)
exports.updateBooking = async (req, res) => {
  try {
    // allow status update by including it in req.body
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete booking by ID
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.searchBookingsPost = async (req, res) => {
  try {
    const { limit = 10, page = 1, query = "", status } = req.body;

    const mongoQuery = {};

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

    const total = await Booking.countDocuments(mongoQuery);

    const bookingsRaw = await Booking.find(mongoQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate({ path: 'fromOffice', select: '_id name' })
      .populate({ path: 'toOffice', select: '_id name' })
      .populate({ path: 'assignedVehicle', select: '_id vehicleNumber' });

    const bookings = bookingsRaw.map((booking) => {
      const b = booking.toObject();

      // Transform assignedVehicle to have "assignedVehicle": vehicleNumber
      if (b.assignedVehicle) {
        b.assignedVehicle = {
          _id: b.assignedVehicle._id,
          assignedVehicle: b.assignedVehicle.vehicleNumber
        };
      }

      return b;
    });

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
