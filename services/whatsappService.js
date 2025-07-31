const axios = require('axios');
const config = process.env;
const logger = require('../utils/logger');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const requestContext = require('../utils/requestContext');

let API_URL = config.WHATSAPP_MESSAGE_URL;
let API_KEY = config.WHATSAPP_API_TOKEN;

/**
 * Format phone number
 * @param {string} phoneNumber - Phone number
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(phoneNumber) {
    logger.info('Formatting phone number', {
        phoneNumber
    });
    if (phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
    }
    if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
        return phoneNumber;
    }
    if (phoneNumber.length > 10 && !phoneNumber.startsWith('91')) {
        throw new Error(`Invalid phone number ${phoneNumber}`);
    }
    if (phoneNumber.length < 10) {
        throw new Error(`Invalid phone number ${phoneNumber}`);
    }
    return phoneNumber;
}

/**
 * Send WhatsApp template message using NETCORE ( PEPISPOST )
 * @param {string} mobile - Mobile number
 * @param {string} templateName - Template name
 * @param {Array} attributes - Template attributes should be passed in specified template order only
 * @returns {Promise<object>} - Response from WhatsApp API
 */
async function sendWhatsAppTemplateMessage(mobile, templateName, attributes) {
    logger.info('Sending WhatsApp template message', {
        mobile,
        templateName,
        attributes
    });
    try {
        const response = await axios.post(API_URL, {
            message: [
                {
                    recipient_whatsapp: formatPhoneNumber(mobile),
                    message_type: "template",
                    recipient_type: "individual",
                    type_template: [
                        {
                            name: templateName,
                            attributes: attributes,
                            language: {
                                locale: "en",
                                policy: "deterministic"
                            }
                        }
                    ]
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if ( response.status !== 200 && response.data.status.toLowerCase() !== 'success') {
            logger.error(`Failed to send WhatsApp message: ${response.data}`);
            return { success: false, error: response.data };
        }

        return { success: true, data: response.data };
    } catch (error) {
        logger.error(`Failed to send WhatsApp message: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Saves WhatsApp conversation and message
 * @param {string} message - The WhatsApp message content
 * @param {object} cargoBooking - The cargo booking object
 * @param {object} response - Response from WhatsApp API
 * @returns {Promise<object>} - Promise that resolves with success/error status
 */
async function saveWhatsAppConversations(message, cargoBooking, response) {
    logger.info('Saving WhatsApp conversation', {
        message,
        bookingId: cargoBooking?.id,
        hasResponse: !!response
    });

    try {
        const whatsAppMessage = new WhatsAppMessage.model({
            message,
            incoming: false,
            response: response?.toString(),
            // sentBy: message.from,
            // sentByUserName: requestContext.getCurrentUser()?.userName,
            sentAt: new Date(),
            bookingId: cargoBooking?.id,
            operatorId: requestContext.getOperatorId()
        });

        const phoneNumber = formatPhoneNumber(cargoBooking.receiverPhone?.toString());

        const existingConversation = await WhatsAppConversation.findOne({
            phoneNumber,
            referenceType: WhatsAppConversation.CARGO_BOOKING_TYPE,
            operatorId: requestContext.getOperatorId()
        });

        if (existingConversation) {
            existingConversation.messages.push(whatsAppMessage);
            await existingConversation.save();
        } else {
            const newConversation = new WhatsAppConversation({
                name: cargoBooking.receiverName,
                messages: [ whatsAppMessage ],
                phoneNumber,
                from: config.NETCORE_PHONE_NUMBER,
                replyPending: false,
                operatorId: requestContext.getOperatorId(),
                referenceType: WhatsAppConversation.CARGO_BOOKING_TYPE
            });
            await newConversation.save();
        }

        await whatsAppMessage.save();
        return { success: true, message: 'WhatsApp conversation saved successfully' };
    } catch (error) {
        logger.error(`Failed to save WhatsApp conversation: ${error.message}`);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendWhatsAppTemplateMessage,
    saveWhatsAppConversations
};