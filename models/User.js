const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  //orgId
  fullName: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  cargoBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },
},
{timestamps: true});

module.exports = mongoose.model('User', userSchema);
  