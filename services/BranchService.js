const Branch = require('../models/Branch');
const logger = require('../utils/logger');

class BranchService {
  /**
   * Create a new branch
   * @param {Object} branchData - Branch data
   * @returns {Promise<Object>} Created branch
   */
  static async createBranch(branchData) {
    try {
      const branch = new Branch({
        ...branchData,
        status: branchData.status?.toLowerCase() || 'active'
      });

      await branch.save();
      return branch;
    } catch (error) {
      logger.error('Error creating branch', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all branches with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Branches and total count
   */
  static async getBranches({ page = 1, limit = 10, operatorId }) {
    try {
      const skip = (page - 1) * limit;
      const query = operatorId ? { operatorId } : {};

      const [branches, total] = await Promise.all([
        Branch.find(query).skip(skip).limit(limit),
        Branch.countDocuments(query)
      ]);

      return { data: branches, total };
    } catch (error) {
      logger.error('Error getting branches', { error: error.message });
      throw error;
    }
  }

  /**
   * Get branch by ID
   * @param {string} id - Branch ID
   * @param {string} [operatorId] - Optional operator ID for validation
   * @returns {Promise<Object>} Branch details
   */
  static async getBranchById(id, operatorId) {
    try {
      const query = { _id: id };
      if (operatorId) query.operatorId = operatorId;

      const branch = await Branch.findOne(query);
      if (!branch) {
        throw new Error('Branch not found');
      }
      return branch;
    } catch (error) {
      logger.error(`Error getting branch ${id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Update branch
   * @param {string} id - Branch ID
   * @param {Object} updateData - Data to update
   * @param {string} [operatorId] - Optional operator ID for validation
   * @returns {Promise<Object>} Updated branch
   */
  static async updateBranch(id, updateData, operatorId) {
    try {
      const query = { _id: id };
      if (operatorId) query.operatorId = operatorId;

      if (updateData.status) {
        updateData.status = updateData.status.toLowerCase();
      }

      const branch = await Branch.findOneAndUpdate(
        query,
        updateData,
        { new: true, runValidators: true }
      );

      if (!branch) {
        throw new Error('Branch not found');
      }

      return branch;
    } catch (error) {
      logger.error(`Error updating branch ${id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Delete branch
   * @param {string} id - Branch ID
   * @param {string} [operatorId] - Optional operator ID for validation
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteBranch(id, operatorId) {
    try {
      const query = { _id: id };
      if (operatorId) query.operatorId = operatorId;

      const branch = await Branch.findOneAndDelete(query);
      if (!branch) {
        throw new Error('Branch not found');
      }
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting branch ${id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Search branches with pagination
   * @param {Object} options - Search options
   * @param {string} options.query - Search query
   * @param {number} options.limit - Results per page
   * @param {number} options.page - Page number
   * @param {string} [options.operatorId] - Optional operator ID for filtering
   * @returns {Promise<Object>} Search results and pagination info
   */
  static async searchBranches({ query = "", limit = 10, page = 1, operatorId }) {
    try {
      const searchCondition = {
        name: { $regex: query, $options: 'i' },
      };

      if (operatorId) {
        searchCondition.operatorId = operatorId;
      }

      const skip = (page - 1) * limit;

      const [branches, total] = await Promise.all([
        Branch.find(searchCondition).skip(skip).limit(limit),
        Branch.countDocuments(searchCondition)
      ]);

      return {
        data: branches,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error searching branches', { error: error.message });
      throw error;
    }
  }
}

module.exports = BranchService;
