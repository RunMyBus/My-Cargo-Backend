const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  manager: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Branch', branchSchema);
