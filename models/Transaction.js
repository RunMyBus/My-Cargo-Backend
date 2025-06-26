// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  oldBalance: { type: Number },
  type: { type: String, enum: ['Booking', 'Transfer'], required: true },
 referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
 cashTransferId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashTransfer' },
  description: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);
