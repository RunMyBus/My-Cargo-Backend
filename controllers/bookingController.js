const BookingService = require('../services/BookingService');
const logger = require('../utils/logger');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const booking = await BookingService.createBooking(req.body, req.user._id, operatorId);
    res.status(201).json(booking);
  } catch (error) {
    logger.error('Error creating booking in controller', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all bookings
 * @returns {Promise<Object>} JSON object with bookings and stats
 */
exports.getAllBookings = async (req, res) => {
  try {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const result = await BookingService.getAllBookings(operatorId);
    res.json(result);
  } catch (error) {
    logger.error('Error getting all bookings in controller', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get unassigned bookings with pagination
 */
exports.getUnassignedBookings = async (req, res) => {
  try {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await BookingService.getUnassignedBookings(operatorId, page, limit);
    res.json(result);
  } catch (error) {
    logger.error('Error getting unassigned bookings in controller', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get booking by ID
 */
exports.getBookingById = async (req, res) => {
  try {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const booking = await BookingService.getBookingById(req.params.id, operatorId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: error.message });
    }
    logger.error(`Error getting booking by id in controller: ${req.params.id}`, { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update booking by ID
 */
exports.updateBooking = async (req, res) => {
  try {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const booking = await BookingService.updateBooking(
      req.params.id, 
      req.body,
      operatorId
    );
    res.json(booking);
  } catch (error) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: error.message });
    }
    logger.error(`Error updating booking in controller: ${req.params.id}`, { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete booking by ID
 */
exports.deleteBooking = async (req, res) => {
  try {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const result = await BookingService.deleteBooking(req.params.id, operatorId);
    res.json(result);
  } catch (error) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: error.message });
    }
    logger.error(`Error deleting booking in controller: ${req.params.id}`, { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

/**
 * Search bookings with filters
 */
exports.searchBookingsPost = async (req, res) => {
  try {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const { limit = 10, page = 1, query = "", status } = req.body;
    const result = await BookingService.searchBookings({ 
      operatorId,
      limit, 
      page, 
      query, 
      status 
    });
    res.json(result);
  } catch (error) {
    logger.error('Error searching bookings in controller', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};
