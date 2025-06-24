// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // optional
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  type: { type: String, enum: ['Booking', 'Transfer'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // booking or cashTransfer ID
  description: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);
