const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
const requestContext = require('../utils/requestContext');
const mongoose = require('mongoose');
const chartService = require('../services/chartService');

// Get today's bookings segregated by payment type (ToPay/Paid)
exports.getTodayBookingsByPayment = async (req, res) => {
    try {
        const data = await chartService.getTodayBookingsByPayment();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get ToPay and Paid bookings across all branches
exports.getBookingsByBranchAndPayment = async (req, res) => {
    try {
        const data = await chartService.getBookingsByBranchAndPayment();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get bookings for last 6 months grouped by month and payment type
exports.getSixMonthBookings = async (req, res) => {
    try {
        const requestedMonth = req.query.month;
        const data = await chartService.getSixMonthBookings(requestedMonth);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get pending bookings by branch location, categorized by payment type (Paid/ToPay)
exports.getPendingBookingsByBranch = async (req, res) => {
    try {
        const data = await chartService.getPendingBookingsByBranch();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error in getPendingDeliveriesByOffice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending deliveries by office',
            error: error.message
        });
    }
};