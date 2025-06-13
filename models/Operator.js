const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code : {type: String, required: true},
    address: { type: String },
    phone: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('operator', operatorSchema);
