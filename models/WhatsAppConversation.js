const mongoose = require('mongoose');
const { schema: whatsappMessageSchema } = require('./WhatsAppMessage');

const whatsappConversationSchema = new mongoose.Schema({
  phoneNumber: { type: String, index: true },
  from: { type: String, index: true },
  replyPending: { type: Boolean, default: false },
  messages: [whatsappMessageSchema],
  referenceType: { type: String },
  complaint: { type: Boolean, default: false },
  name: { type: String },
  lastMessage: { type: String },
  lastMessageDateTime: { type: Date },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
}, {
  timestamps: true
});

whatsappConversationSchema.statics.CARGO_BOOKING_TYPE = "CargoBooking";

module.exports = mongoose.model('WhatsAppConversation', whatsappConversationSchema);
