const mongoose = require('mongoose');

const whatsappMessageSchema = new mongoose.Schema({
  message: { type: String },
  incoming: { type: Boolean },
  response: { type: String },
  sentBy: { type: String },
  sentByUserName: { type: String },
  sentAt: { type: Date, default: Date.now },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator'},
});

module.exports = {
  schema: whatsappMessageSchema,
  model: mongoose.model('WhatsAppMessage', whatsappMessageSchema)
};