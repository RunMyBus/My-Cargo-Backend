const logger = require('../utils/logger');
const ewayBillService = require('../services/ewayBillService');

exports.verifyEWayBillNumber = async (req, res) => {
    try {
        if (!req.query.waybillNumber) {
            return res.status(400).json({ error: 'Waybill number is required' });
        }
        const result = await ewayBillService.getWayBillDetails(req.query.waybillNumber);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Error in verifyWayBillNumber:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.updateVehicleNumber = async (req, res) => {
    try {
        if (!req.body.ewbNo || !req.body.vehicleNo) {
            return res.status(400).json({ error: 'EWayBill number and vehicle number are required' });
        }
        const result = await ewayBillService.updateVehicleNumber(req.body);
        res.json(result);
    } catch (error) {
        logger.error('Error in updateVehicleNumber:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.updateTransporter = async (req, res) => {
    try {
        if (!req.body.ewbNo || !req.body.transporterId) {
            return res.status(400).json({ error: 'EWayBill number and transporter ID are required' });
        }
        const result = await ewayBillService.updateTransporter(req.body.ewbNo, req.body.transporterId);
        res.json(result);
    } catch (error) {
        logger.error('Error in updateTransporter:', error);
        res.status(400).json({ error: error.message });
    }
};
