const { log } = require('winston');
const BookingService = require('../services/BookingService');
const logger = require('../utils/logger');
const requestContext = require('../utils/requestContext');
const { Parser } = require('json2csv');
const ExportService = require('../services/ExportService');


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
    const userId = req.user._id;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }
    const booking = await BookingService.updateBooking(
      req.params.id, 
      req.body,
      operatorId,
      userId
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
    const result = await BookingService.deleteBooking(req.params.id, operatorId );
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

    const { page = 1, limit = 10, query = "", branches } = req.body;
    
    // If no branches specified, get the logged-in user's branch
    const branchIds = branches ? branches : [];

    const result = await BookingService.getUnassignedBookings(operatorId, page, limit, query, branchIds);
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

    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const { page = 1, limit = 10, query = "" } = req.body;

    const result = await BookingService.getAssignedBookings(operatorId, page, limit, query);
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
    const userId = req.user._id;
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const { page = 1, limit = 10, query = "", branches } = req.body;
    
    const branchIds = branches ? branches : [];

    const result = await BookingService.getInTransitBookings(operatorId, userId, page, limit, query, branchIds);
    res.json(result);
  } catch (error) {
    logger.error('Error getting in-transit bookings in controller', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get arrived bookings
exports.getArrivedBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    const userId = req.user._id;

    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const { page = 1, limit = 10, query = "", branches } = req.body;

    const branchIds = branches ? branches : [];

    const result = await BookingService.getArrivedBookings(operatorId, userId, page, limit, query, branchIds);

    res.json(result);
  } catch (error) {
    logger.error('Error getting arrived bookings:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Search bookings with pagination
// Search bookings with pagination
exports.searchBookings = async (req, res) => {
  try {
    const { limit = 10, page = 1, query = "", status = "" } = req.body;
    const operatorId = req.user?.operatorId;

    if (!operatorId) {
      return res.status(400).json({ message: "Operator ID missing" });
    }

    const result = await BookingService.searchBookings({
      operatorId,
      limit,
      page,
      query,
      status
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('SEARCH_BOOKINGS_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.exportBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const csv = await ExportService.exportBookings(operatorId);

    res.header('Content-Type', 'text/csv');
    res.attachment(`bookings-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting bookings', { error: error.message });
    res.status(500).json({ error: 'Failed to export bookings' });
  }
};

exports.exportUnassignedBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const query = req.query?.query || '';

    const csv = await ExportService.exportUnassignedBookings(operatorId, query);

    res.header('Content-Type', 'text/csv');
    res.attachment(`unassigned_bookings_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    if (error.message === 'No unassigned bookings found to export') {
      return res.status(404).json({ message: error.message });
    }

    logger.error('Error exporting unassigned bookings', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: 'Failed to export unassigned bookings' });
  }
};

exports.exportArrivedBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const query = req.body?.query || '';

    const csv = await ExportService.exportArrivedBookings(operatorId, query);

    res.header('Content-Type', 'text/csv');
    res.attachment(`arrived_bookings_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    if (error.message === 'No arrived bookings found to export') {
      return res.status(404).json({ message: error.message });
    }

    logger.error('Error exporting arrived bookings', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: 'Failed to export arrived bookings' });
  }
};

exports.exportInTransitBookings = async (req, res) => {
  try {
    const operatorId = requestContext.getOperatorId();
    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const query = req.body?.query || '';

    const csv = await ExportService.exportInTransitBookings(operatorId, query);

    res.header('Content-Type', 'text/csv');
    res.attachment(`in_transit_bookings_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    if (error.message === 'No in transit bookings found to export') {
      return res.status(404).json({ message: error.message });
    }

    logger.error('Error exporting in transit bookings', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: 'Failed to export in transit bookings' });
  }
};
