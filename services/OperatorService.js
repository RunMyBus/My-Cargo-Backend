const Operator = require('../models/Operator');
logger = require('../utils/logger');

class OperatorService {
    static async createOperator(operatorData) {
        // Check if operator with same name or code already exists
        const existingOperator = await Operator.findOne({
            $or: [
                { name: operatorData.name },
                { code: operatorData.code }
            ]
        });
        if (existingOperator) {
            logger.error('Operator with this name or code already exists');
            throw new Error('Operator with this name or code already exists');
        }
        const operator = new Operator(operatorData);
        await operator.save();
        return operator;
    }

    static async getAllOperators() {
        return await Operator.find();
    }

    static async searchOperators(query = "", page = 1, limit = 10) {
        const regex = new RegExp(query, "i");
        const skip = (page - 1) * limit;

        const total = await Operator.countDocuments({ name: regex });
        const operators = await Operator.find({ name: regex })
            .skip(skip)
            .limit(Number(limit));

        return {
            data: operators,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
        };
    }
}

module.exports = OperatorService;
