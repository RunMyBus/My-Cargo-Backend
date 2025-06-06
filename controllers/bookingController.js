const BookingService = require('../services/BookingService');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const booking = await BookingService.createBooking(req.body, req.user._id);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    // Get all bookings sorted by creation date descending
    const bookings = await Booking.find().sort({ createdAt: -1 });

    // Total count of bookings
    const totalCount = await Booking.countDocuments();

    // Calculate the start of today (midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Count bookings created today (createdAt >= startOfToday)
    const todayCount = await Booking.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    res.json({
      bookings,
      totalCount,
      todayCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get booking by ID
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
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
      // Search bookingId OR senderName OR receiverName with case-insensitive regex
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
    const bookings = await Booking.find(mongoQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

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

