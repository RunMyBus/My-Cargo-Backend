const requestContext = require('../utils/requestContext');
const logger = require('../utils/logger');
const config = process.env;
const WhatsAppJSONMessage = require('../models/WhatsAppJSONMessage');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const WhatsAppMessage = require('../models/WhatsAppMessage');

const XLSX = require('xlsx');
const fs = require('fs');

exports.getWhatsAppReport = async (req, res) => {
try {
        const operatorId = requestContext.getOperatorId();
        console.log(operatorId);
        if (!operatorId) {
            return res.status(400).json({ error: 'Operator ID is required' });
        }

        // Aggregate to get count of template messages (incoming: false) by phone number
        const reportData = await WhatsAppConversation.aggregate([
            { $match: { operatorId } },
            { $unwind: '$messages' },
            { $match: { 'messages.incoming': false } },
            {
                $group: {
                    _id: '$phoneNumber',
                    phoneNumber: { $first: '$phoneNumber' },
                    templateMessageCount: { $sum: 1 },
                    lastMessageDate: { $max: '$messages.sentAt' }
                }
            },
            { $sort: { lastMessageDate: -1 } }
        ]);

        if (reportData.length === 0) {
            return res.status(404).json({ message: 'No template messages found' });
        }

        // Format data for Excel
        const formattedData = reportData.map(item => ({
            'Phone Number': item.phoneNumber ? item.phoneNumber.replace(/^91/, '') : 'N/A',
            'Messages Sent': item.templateMessageCount,
            'Last Message Date': item.lastMessageDate ? new Date(item.lastMessageDate).toLocaleString() : 'N/A'
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);
        
        // Set column widths
        const wscols = [
            { wch: 20 }, // Phone Number
            { wch: 20 }, // Template Messages
            { wch: 25 }  // Last Message Date
        ];
        ws['!cols'] = wscols;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'WhatsApp Template Messages');

        // Generate Excel file
        const fileName = `whatsapp_template_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        const filePath = `./temp/${fileName}`;
        
        // Ensure temp directory exists
        if (!fs.existsSync('./temp')) {
            fs.mkdirSync('./temp');
        }

        // Write a file
        XLSX.writeFile(wb, filePath);

        // Send the file for download
        res.download(filePath, fileName, (err) => {
            if (err) {
                logger.error('Error sending WhatsApp report file', { error: err.message });
                return res.status(500).json({ error: 'Error downloading report' });
            }
            // Delete the temporary file after sending
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        logger.error('Error generating WhatsApp report', { error: error.message, stack: error.stack });
        res.status(400).json({
            error: 'Failed to generate WhatsApp report',
            message: error.message
        });
    }
};

exports.incomingWhatsAppReply = async (req, res) => {
    try {
        logger.info('processing incoming whatsapp reply');
        logger.info('Request Headers:', req.headers);
        logger.info('Request Body:', req.body);

        processIncomingMessage(req.body);
        
        // Send a simple response
        return res.status(200).json({
            status: 'success',
            message: 'Webhook received successfully'
        });
    } catch (error) {
        logger.error('Error in incomingWhatsAppReply:', error);
        return res.status(400).json({ error: error.message });
    }
};

exports.eventWhatsAppReply = async (req, res) => {
    try {
        logger.info('processing event whatsapp reply');
        logger.info('Request Headers:', req.headers);
        logger.info('Request Body:', req.body);


        processEvent(req.body);
        
        // Send a simple response
        return res.status(200).json({
            status: 'success',
            message: 'Webhook received successfully'
        });
    } catch (error) {
        logger.error('Error in eventWhatsAppReply:', error);
        return res.status(400).json({ error: error.message });
    }
};

const processEvent = async (event) => {
    try {
        const { delivery_status } = event;
        if (!delivery_status || !Array.isArray(delivery_status)) {
            logger.warn('No delivery status data found in event');
            return;
        }

        for (const status of delivery_status) {
            const { ncmessage_id, status: eventStatus } = status;
            if (!ncmessage_id) {
                logger.warn('No message ID found in delivery status');
                continue;
            }

            // Find or create WhatsAppJSONMessage
            const message = await WhatsAppJSONMessage.findOneAndUpdate(
                { messageId: ncmessage_id },
                { $addToSet: { status: eventStatus, events: JSON.stringify(status) } },
                { upsert: true, new: true }
            );

            logger.info('WhatsApp delivery status processed', {
                messageId: ncmessage_id,
                status: eventStatus,
                eventStatusCount: message.status.length,
                eventCount: message.events.length
            });
        }
    } catch (error) {
        logger.error('Error in processEvent:', {
            error: error.message,
            stack: error.stack,
            event
        });
    }
};

const processIncomingMessage = async (message) => {
    try {
        const { incoming_message } = message;
        if (!incoming_message || !Array.isArray(incoming_message)) {
            logger.warn('No incoming messages found in event');
            return;
        }

        for (const msg of incoming_message) {
            if (!msg.from) {
                logger.warn('No sender found in incoming message');
                continue;
            }

            // Create WhatsAppMessage
            const whatsAppMessage = new WhatsAppMessage.model({
                message: msg.text_type?.text || '',
                incoming: true,
                response: JSON.stringify(msg),
                sentBy: msg.from,
                sentByUserName: msg.from_name
            });

            // Find or create conversation
            const phoneNumber = msg.from;
            const existingConversation = await WhatsAppConversation.findOne({
                phoneNumber
            });

            if (existingConversation) {
                existingConversation.messages.push(whatsAppMessage);
                await existingConversation.save();
            } else {
                const newConversation = new WhatsAppConversation({
                    name: msg.from_name || phoneNumber,
                    messages: [ whatsAppMessage ],
                    phoneNumber,
                    from: config.NETCORE_PHONE_NUMBER,
                    replyPending: true
                });
                await newConversation.save();
            }

            await whatsAppMessage.save();

            logger.info('WhatsApp incoming message processed', msg);
        }
    } catch (error) {
        logger.error('Error in processIncomingMessage:', {
            error: error.message,
            stack: error.stack,
            message
        });
    }
};
