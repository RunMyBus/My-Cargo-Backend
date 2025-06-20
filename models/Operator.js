const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  name: { type: String, required: true },
   code: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true,     // automatically convert to uppercase on save
    minlength: 3,
    maxlength: 3,
    validate: {
      validator: function(v) {
        // v is already uppercase
        const validFormat = /^[A-Z0-9]{3}$/.test(v);
        const hasLetter = /[A-Z]/.test(v);
        return validFormat && hasLetter;
      },
      message: props => `${props.value} is invalid. Code must be 3 alphanumeric uppercase chars with at least one letter.`
    }
  },
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
