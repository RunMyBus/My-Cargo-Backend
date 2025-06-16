const mongoose = require('mongoose');


const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true },        // e.g., "create_user"
  description: { type: String },                 // e.g., "Allows creating users"
  createdAt: { type: Date, default: Date.now },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator'}
});

module.exports = mongoose.model('Permission', permissionSchema);
