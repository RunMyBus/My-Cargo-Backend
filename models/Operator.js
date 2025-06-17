const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  address: { type: String },
  phone: { type: String, required: true },
  bookingSequence: { type: Number, default: 1 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  paymentOptions: {
    type: [{
      type: String,
      enum: ['cash', 'UPI'],
      required: true
    }],
    default: ['cash'],
    validate: {
      validator: function(v) {
        return v.length > 0 && v.every(option => ['cash', 'UPI'].includes(option));
      },
      message: 'Payment options must include at least one valid option: cash or UPI'
    }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

// Correct: Capitalized model name
module.exports = mongoose.model('Operator', operatorSchema);
