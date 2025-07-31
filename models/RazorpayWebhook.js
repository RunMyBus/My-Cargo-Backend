const mongoose = require('mongoose');

const RazorpayWebhookSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true
    },
    responses: [{
        type: mongoose.Schema.Types.Mixed,
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const RazorpayWebhook = mongoose.model('RazorpayWebhook', RazorpayWebhookSchema);

module.exports = RazorpayWebhook;
