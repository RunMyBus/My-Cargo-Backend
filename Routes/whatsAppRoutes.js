const express = require('express');
const router = express.Router();
const whatsAppController = require('../controllers/whatsappController');

router.post('/webhooks/incoming/receive', whatsAppController.incomingWhatsAppReply);
router.post('/webhooks/event/receive', whatsAppController.eventWhatsAppReply);

module.exports = router;