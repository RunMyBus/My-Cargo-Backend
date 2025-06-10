const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  //orgId
  fullName: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
},
{timestamps: true});

module.exports = mongoose.model('User', userSchema);
  