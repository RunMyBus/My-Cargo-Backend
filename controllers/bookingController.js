const BookingService = require('../services/BookingService');
const logger = require('../utils/logger');
const requestContext = require('../utils/requestContext');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
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
    const operatorId = requestContext.getOperatorId();
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

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
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

// Update booking by ID
exports.updateBooking = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
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

// Delete booking by ID
exports.deleteBooking = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
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

// Get unassigned bookings with pagination
exports.getUnassignedBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const { page = 1, limit = 10, query = "" } = req.body;

    const result = await BookingService.getUnassignedBookings(operatorId, page, limit, query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting unassigned bookings in controller', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get assigned bookings
exports.getAssignedBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    const currentUserId = req.user._id;

    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const { page = 1, limit = 10, query = "" } = req.body;

    const result = await BookingService.getAssignedBookings(operatorId, currentUserId, page, limit, query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting assigned bookings in controller', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get in-transit bookings
exports.getInTransitBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const { page = 1, limit = 10, query = "" } = req.body;

    const result = await BookingService.getInTransitBookings(operatorId, page, limit, query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting in-transit bookings in controller', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get arrived bookings
exports.getArrivedBookings = async (req, res) => {
  try {
    console.log('getArrivedBookings called');
    const operatorId = requestContext.getOperatorId();
    console.log('operatorId:', operatorId);

    if (!operatorId) {
      console.log('No operatorId provided');
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const { page = 1, limit = 10, query = "" } = req.body;
    console.log({ page, limit, query });

    const result = await BookingService.getArrivedBookings(operatorId, page, limit, query);
    console.log('Result:', result);

    res.json(result);
  } catch (error) {
    console.error('Error getting arrived bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Search bookings with pagination
exports.searchBookingsPost = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
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