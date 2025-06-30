const logger = require('../utils/logger');
const ewayBillService = require('../services/ewayBillService');

exports.updateVehicleNumber = async (req, res) => {
    try {
        const result = await ewayBillService.updateVehicleNumber(req.body);
        res.json(result);
    } catch (error) {
        logger.error('Error in updateVehicleNumber:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.updateTransporter = async (req, res) => {
    try {
        const result = await ewayBillService.updateTransporter(req.body.ewbNo, req.body.transporterId);
        res.json(result);
    } catch (error) {
        logger.error('Error in updateTransporter:', error);
        res.status(400).json({ error: error.message });
    }
};