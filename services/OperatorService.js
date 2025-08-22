const Operator = require('../models/Operator');
logger = require('../utils/logger');

class OperatorService {
  static async createOperator(operatorData) {
    if (operatorData.code) {
      operatorData.code = operatorData.code.toUpperCase();
    }

    if (!/^[A-Z0-9]{3}$/.test(operatorData.code)) {
      throw new Error('Code must be exactly 3 characters, containing only uppercase letters and numbers.');
    }
    if (!/[A-Z]/.test(operatorData.code)) {
      throw new Error('Code must contain at least one uppercase letter.');
    }

    // Check if operator with same code exists
    const existingCode = await Operator.findOne({ code: operatorData.code });
    if (existingCode) {
      throw new Error('Code already exists, try a different code');
    }

    // Check if operator with same name exists
    const existingName = await Operator.findOne({ name: operatorData.name });
    if (existingName) {
      throw new Error('Operator with this name already exists');
    }

      // Check if operator with same name exists
      const existingTemplateName = await Operator.findOne({ name: operatorData.bookingTemplate });
      if (existingTemplateName) {
          throw new Error('Operator with this template name already exists');
      }

    const operator = new Operator(operatorData);
    await operator.save();
    return operator;
  }

    static async getAllOperators() {
        return await Operator.find();
    }

     /**
     * Update operator by ID
     * @param {String} operatorId - Operator's MongoDB ObjectId
     * @param {Object} updateData - Fields to update
     * @returns {Object|null}
     */
    static async updateOperator(operatorId, updateData) {
        try {
            const updatedOperator = await Operator.findByIdAndUpdate(
                operatorId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedOperator) {
                logger.warn(`Operator not found: ${operatorId}`);
                return null;
            }

            return updatedOperator;
        } catch (error) {
            logger.error(`Error updating operator: ${error.message}`);
            throw new Error('Failed to update operator');
        }
    }

    /**
 * Delete operator by ID
 * @param {String} operatorId - Operator's MongoDB ObjectId
 * @returns {Object|null}
 */
static async deleteOperator(operatorId) {
    try {
        const deletedOperator = await Operator.findByIdAndDelete(operatorId);

        if (!deletedOperator) {
            logger.warn(`Operator not found for deletion: ${operatorId}`);
            return null;
        }

        logger.info(`Operator deleted: ${deletedOperator._id}`);
        return deletedOperator;
    } catch (error) {
        logger.error(`Error deleting operator: ${error.message}`);
        throw new Error('Failed to delete operator');
    }
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

 /**
   * Get payment options for a specific operator
   * @param {string} operatorId
   * @returns {Promise<Array>} paymentOptions
   */
  static async getPaymentOptions(operatorId) {
    try {
      logger.info('Fetching payment options', { operatorId });

      const operator = await Operator.findById(operatorId);
      if (!operator) {
        logger.warn('Operator not found for payment options', { operatorId });
        return null;
      }

      return operator.paymentOptions || [];
    } catch (error) {
      logger.error('Failed to fetch payment options', {
        error: error.message,
        operatorId,
        stack: error.stack
      });
      throw new Error('Unable to fetch payment options');
    }
  }
}


module.exports = OperatorService;
