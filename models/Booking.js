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
  fromOffice: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  toOffice: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
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
    enum: ['Paid', 'UnPaid'],
    default: 'Paid',
    required: true
  },
}, { timestamps: true });

bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    const typeLetter = this.type ? this.type.charAt(0).toUpperCase() : 'X'; // fallback 'X'

    // Format date + time: YYYYMMDDHHMMSS
    const now = new Date();
    const pad = (num, size = 2) => num.toString().padStart(size, '0');
    const dateTimeString =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    // Find last booking with same prefix to get sequence number
    const regex = new RegExp(`^${typeLetter}${dateTimeString}(\\d{3})$`);
    const lastBooking = await this.constructor.findOne({ bookingId: { $regex: regex } })
      .sort({ bookingId: -1 })
      .exec();

    let sequenceNumber = 1;
    if (lastBooking && lastBooking.bookingId) {
      const lastSeqStr = lastBooking.bookingId.slice(-3);
      const lastSeqNum = parseInt(lastSeqStr, 10);
      sequenceNumber = lastSeqNum + 1;
    }

    const seqString = sequenceNumber.toString().padStart(3, '0');

    this.bookingId = `${typeLetter}${dateTimeString}${seqString}`;
  }
  next();
});


const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
