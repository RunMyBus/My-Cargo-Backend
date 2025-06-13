const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
  senderName: String,
  senderPhone: { type: String, required: true },
  senderEmail: String,
  senderAddress: String,
  receiverName: String,
  receiverPhone: { type: String, required: true },
  receiverEmail: String,
  receiverAddress: String,
  fromOffice: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  toOffice: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  packageDescription: String,
  weight: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null,
  },
  dimensions: String,
  status: {
    type: String,
    enum: ['Booked', 'InTransit', 'Cancelled', 'Delivered'],
    default: 'Booked',
  },
  type: {
    type: String,
    enum: ['Paid', 'ToPay'],
    default: 'Paid',
    required: true
  },

}, { timestamps: true });


const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
