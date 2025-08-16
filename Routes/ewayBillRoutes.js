const express = require('express');
const router = express.Router();
const passport = require('passport');

const eWayBillController = require('../controllers/ewayBillController');

router.use(passport.authenticate('jwt', { session: false }));

router.get('/verifyEWayBillNumber', eWayBillController.verifyEWayBillNumber);
router.post('/updateVehicleNumber', eWayBillController.updateVehicleNumber);
router.post('/updateTransporter', eWayBillController.updateTransporter);

module.exports = router;
