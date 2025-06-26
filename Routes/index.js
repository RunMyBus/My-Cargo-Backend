const express = require('express');
const router = express.Router(); 
const authRoutes = require('./authRoutes');
const roleRoutes = require('./roleRoutes');
const branchRoutes = require('./branchRoutes');
const userRoutes = require('./userRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const bookingRoutes = require('./bookingRoutes');
const operatorRoutes = require('./operatorRoutes');
const chartRoutes = require('./chartRoutes');
const cashTransferRoutes = require('./cashTransferRoutes');
const transactionRoutes = require('./transactionRoutes');
const trackShipmentRoutes = require('./trackShipmentRoutes');

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/branches', branchRoutes);
router.use('/users', userRoutes);
router.use('/vehicle', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/operators', operatorRoutes);
router.use('/charts', chartRoutes);
router.use('/cashtransfers', cashTransferRoutes);
router.use('/transactions', transactionRoutes);
router.use('/trackShipment', trackShipmentRoutes);

module.exports = router;