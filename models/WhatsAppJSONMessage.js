const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WhatsAppJSONMessageSchema = new Schema({
    messageId: {
        type: String,
        required: true
    },
    status: [{
        type: String,
        required: true
    }],
    events: [{
        type: String,
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const WhatsAppJSONMessage = mongoose.model('WhatsAppJSONMessage', WhatsAppJSONMessageSchema);

module.exports = WhatsAppJSONMessage;
