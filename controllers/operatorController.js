const OperatorService = require('../services/OperatorService');

exports.createOperator = async (req, res) => {
    try {
        const operator = await OperatorService.createOperator(req.body);
        res.status(201).json(operator);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllOperators = async (req, res) => {
    try {
        const operators = await OperatorService.getAllOperators();
        res.status(200).json(operators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.searchOperators = async (req, res) => {
    try {
        const { query = "", page = 1, limit = 10 } = req.body;
        const result = await OperatorService.searchOperators(query, page, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};