const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String },
  bookingDate: { type: String, index: true },

  // Users and operator
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  unloadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },

  // Sender info
  senderName: String,
  senderPhone: { type: String, required: true },
  senderEmail: String,
  senderAddress: String,

  // Receiver info
  receiverName: String,
  receiverPhone: { type: String, required: true },
  receiverEmail: String,
  receiverAddress: String,

  // Branches
  fromOffice: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  toOffice: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },

  // Dates
  dispatchDate: String,
  arrivalDate: String,

  // Package info
  packageDescription: String,
  weight: { type: Number, required: true },
  quantity: { type: Number, required: true },
  valueOfGoods: { type: Number, required: true },
  dimensions: String,

  // Vehicle assignment
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },

  // Status
  status: {
    type: String,
    enum: ['Booked', 'InTransit', 'Cancelled', 'Arrived', 'Delivered'],
    default: 'Booked',
  },

  // Charges
  freightCharge: { type: Number, default: 0 },
  loadingCharge: { type: Number, default: 0 },
  unloadingCharge: { type: Number, default: 0 },
  otherCharge: { type: Number, default: 0 },
  totalAmountCharge: { type: Number, default: 0 },

  // LR Type
  lrType: {
    type: String,
    enum: ['Paid', 'ToPay'],
    default: 'Paid',
    required: true
  },

  paymentType: {
  type: String,
  enum: ['', 'cash', 'UPI'],
  default: ''
}

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);