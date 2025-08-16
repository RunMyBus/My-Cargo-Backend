const express = require('express');
const router = express.Router();
const whatsAppController = require('../controllers/whatsappController');
const passport = require("passport");

router.post('/webhooks/incoming/receive', whatsAppController.incomingWhatsAppReply);
router.post('/webhooks/event/receive', whatsAppController.eventWhatsAppReply);

router.use(passport.authenticate('jwt', { session: false }));

router.get('/getWhatsAppReport', whatsAppController.getWhatsAppReport);

module.exports = router;
