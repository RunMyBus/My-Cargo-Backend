const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  senderName: String,
  senderPhone: String,
  senderEmail: String,
  senderAddress: String,
  receiverName: String,
  receiverPhone: String,
  receiverEmail: String,
  receiverAddress: String,
  fromOffice: String,
  toOffice: String,
  packageDescription: String,
  weight: String,
  dimensions: String,
  assignedVehicle: String,
  status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Cancelled', 'Delivered'], 
    default: 'Pending',
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
