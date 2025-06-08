const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  bookingDate: { type: String, index: true },
  senderName: String,
  senderPhone: {type:String, required: true},
  senderEmail: String,
  senderAddress: String,
  receiverName: String,
  receiverPhone:  {type:String, required: true},
  receiverEmail: String,

  receiverAddress: String,
  fromOffice: String,
  toOffice: String,
  packageDescription: String,
  weight: String,
  dimensions: String,
  assignedVehicle: String,
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
  totalAmount: { type: Number, default: 0 },
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

// Pre-save hook to generate bookingId like B001, B002 ...
bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Get last bookingId in DB
    const lastBooking = await this.constructor.findOne().sort({ createdAt: -1 }).exec();
    if (!lastBooking || !lastBooking.bookingId) {
      this.bookingId = 'B001';
    } else {
      const lastIdNum = parseInt(lastBooking.bookingId.slice(1)); 
      const newIdNum = lastIdNum + 1;
      this.bookingId = 'B' + newIdNum.toString().padStart(3, '0');
    }
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
