const RazorpayService = require('../services/RazorpayService');
const logger = require('../utils/logger');
const RazorpayWebhook = require('../models/RazorpayWebhook');
const Booking = require('../models/Booking');
const BookingService = require('../services/BookingService');
const config = process.env;
const requestContext = require('../utils/requestContext');

// Generate QR code for payment
exports.generateQRCode = async (req, res) => {
    try {
      const operatorId = requestContext.getOperatorId() || req.user?.operatorId;
      console.log('operatorId', operatorId);
      
      if (!operatorId) {
        return res.status(400).json({ success: false, error: 'Operator ID is required' });
      }

      const bookingId = req.params.bookingId;
      const lrType = req.body.lrType;
      const status = req.body.status;
      const paymentTypes = req.body.paymentTypes;

      if (!bookingId) {
        return res.status(400).json({ success: false, error: 'Booking ID is required' });
      }

      //  Get Mongoose document
      const booking = await BookingService.getBookingByBookingId(bookingId, operatorId, true);

      // Check if Razorpay is enabled
      if (config.RAZORPAY_ENABLED === 'false') {

        //  Apply update from frontend
        await BookingService.collectPayment(booking, req.user._id, { lrType, status, paymentTypes });
    
        return res.status(200).json({ message: 'Payment collected successfully' });
      }
  
      const qrData = await RazorpayService.generateQRCodeForBooking(bookingId, req.user._id, operatorId, booking.totalAmountCharge, lrType);
      if (!qrData.success) {
        return res.status(400).json({ success: false, error: qrData.error });
      }
      return res.status(200).json({ success: true, qrData });
    } catch (error) {
      logger.error('Error in generateQRCode controller', { error: error.message });
      return res.status(400).json({ success: false, error: error.message });
    }
};

const processWebhook = async (body) => {
    try {
        // Extract bookingId from notes
        const bookingId = body.payload?.qr_code?.entity?.notes?.bookingId || 
                         body.payload?.payment?.entity?.notes?.bookingId;

        const operatorId = body.payload?.qr_code?.entity?.notes?.operatorId || 
                         body.payload?.payment?.entity?.notes?.operatorId;

        const userId = body.payload?.qr_code?.entity?.notes?.userId || 
                         body.payload?.payment?.entity?.notes?.userId;

        const lrType = body.payload?.qr_code?.entity?.notes?.lrType || 
                         body.payload?.payment?.entity?.notes?.lrType;

        // Find or create the webhook record for this booking
        const webhookRecord = await RazorpayWebhook.findOneAndUpdate(
            { bookingId },
            { 
                $push: { responses: body },
                $set: { updatedAt: new Date() }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // If this is qr_code.credited event, verify payment status before updating booking
        if (body.event === 'qr_code.credited') {
            const payment = body.payload?.payment?.entity;
            const qrCode = body.payload?.qr_code?.entity;

            // Verify both conditions:
            // 1. Payment status is 'captured'
            // 2. QR code has exactly 1 payment received and is closed
            if (payment?.status === 'captured' && ( qrCode?.payments_count_received === 1 && qrCode?.status === 'closed' )) {
                const booking = await Booking.findOne({ bookingId, operatorId });

                const updatedData = {
                    lrType: lrType,
                    status: 'Booked',
                    paymentType: 'UPI'
                }

                BookingService.collectPayment(booking, userId, updatedData);

                logger.info('Successfully updated booking status', { bookingId, operatorId, userId });
            } else {
                logger.warn('Payment verification failed', {
                    bookingId,
                    paymentId: payment?.id,
                    qrCodeId: qrCode?.id
                });
            }
        }
    } catch (error) {
        logger.error('Error processing webhook', {
            error: error.message,
            stack: error.stack,
            body
        });
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        const { body } = req;
        logger.info('handleWebhook', body);
        
        // Process webhook in background
        processWebhook(body);
        
        // Send immediate response
        return res.status(200).json({
            success: true
        });
    } catch (error) {
        logger.error('Error in handleWebhook controller', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        return res.status(200).json({
            success: false,
            error: error.message
        });
    }
};