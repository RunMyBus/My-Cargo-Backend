const UserService = require('../services/UserService');
const logger = require('../utils/logger');
const { getCargoBalance } = require('../services/CargoBalanceService');

/**
 * Get all users for the current operator
 */
exports.getUsers = async (req, res) => {
  try {
    const operatorId = req.user?.operatorId;
    const users = await UserService.getUsers(operatorId);
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error in getUsers controller', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    logger.error('Error in getUserById controller', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

/**
 * Create a new user
 */
exports.createUser = async (req, res) => {
  try {
    const operatorId = req.user?.operatorId;
    if (!operatorId) {
      return res.status(400).json({ message: 'Operator ID is required' });
    }

    const userData = { ...req.body, operatorId };
    const newUser = await UserService.createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    if (['Mobile number already exists', 'Invalid role ID', 'Invalid branch ID'].includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    logger.error('Error in createUser controller', { error: error.message });
    res.status(500).json({ message: 'Failed to create user' });
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await UserService.updateUser(req.params.id, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Invalid role ID') {
      return res.status(400).json({ message: error.message });
    }
    logger.error('Error in updateUser controller', { error: error.message });
    res.status(500).json({ message: 'Failed to update user' });
  }
};

/**
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    await UserService.deleteUser(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    logger.error('Error in deleteUser controller', { error: error.message });
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

/**
 * Search users with pagination
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query = "", page = 1, limit = 10 } = req.body;
    const operatorId = req.user?.operatorId;

    const result = await UserService.searchUsers({
      query,
      page: Number(page),
      limit: Number(limit),
      operatorId
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in searchUsers controller', { error: error.message });
    res.status(500).json({ message: 'Failed to search users' });
  }
};

/**
 * Get today's cargo balance for the current user
 */
exports.getTodayCargoBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await UserService.getTodayCargoBalance(userId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getTodayCargoBalance controller', { error: error.message });
    res.status(500).json({ message: 'Failed to get cargo balance' });
  }
};

exports.getDailyCargoBalance = async (req, res) => {
  try {
    const operatorId = req.user.operatorId; // from auth middleware
    const { startDate, endDate } = req.query;

    const data = await getCargoBalance(operatorId, startDate, endDate);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
