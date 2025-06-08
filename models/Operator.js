const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String, required: true },
    type: { type: String, enum: ['bitla', 'abhibus', 'ezeeinfo', 'other'],
        required: true, default: 'other' },
    status: { type: String, enum: ['active', 'inactive'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('operator', operatorSchema);
