const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String },
  cargoBalance: { type: Number, default: 0 }, // Cargo balance  
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
      operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' }
},
{timestamps: true});

module.exports = mongoose.model('User', userSchema);
