const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  manager: { type: String },
  status: { type: String, enum: ['active', 'inactive'] },
  createdAt: { type: Date, default: Date.now },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' }
});

module.exports = mongoose.model('Branch', branchSchema);
