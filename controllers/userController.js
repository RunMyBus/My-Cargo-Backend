const User = require('../models/User');
const Role = require('../models/Role');
const Branch = require('../models/Branch');
const bcrypt = require('bcryptjs');
const requestContext = require('../utils/requestContext');
const getDailyCargoBalance = require('../services/CargoBalanceService');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const operatorId = req.user?.operatorId;

    if (!operatorId) {
      return res.status(400).json({ message: 'Operator ID missing from request' });
    }

    const users = await User.find({ operatorId });

    res.status(200).json(users);
  } catch (error) {
    console.error('GET_USERS_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('GET_USER_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { fullName, mobile, password, role, status, branchId } = req.body;

    const operatorId = requestContext.getOperatorId();
    if (!operatorId) {
      return res.status(400).json({ message: 'Operator ID is required' });
    }

    // Check if the mobile number already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }

    // Check if the role ID is valid
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    // Check if the branch ID is valid
    if (branchId) {
      const branchExists = await Branch.findById(branchId);
      if (!branchExists) {
        return res.status(400).json({ message: 'Invalid branch ID' });
      }
    }

    // Format status (optional but safe)
    const formattedStatus = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      fullName,
      mobile,
      password: hashedPassword,
      role,
      status: formattedStatus,
      operatorId,
      branchId,
      cargoBalance: 0,
    });

    const savedUser = await newUser.save();
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('CREATE_USER_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { fullName, mobile, password, role, status } = req.body;

    const updateData = { fullName, mobile, role, status };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role) {
        const roleExists = await Role.findById(role);
        if (!roleExists) {
            return res.status(400).json({ message: 'Invalid role ID' });
        }
    }


    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true
    });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('UPDATE_USER_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE_USER_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query = "", page = 1, limit = 10 } = req.body;
    const regex = new RegExp(query, "i"); 
    const skip = (page - 1) * limit;
    const operatorId = requestContext.getOperatorId();

    const queryObj = query ? { fullName: regex } : {};
    const baseQuery = { operatorId, ...queryObj };
    
    const total = await User.countDocuments(baseQuery);
    const users = await User.find(baseQuery)
      .populate("role")
      .populate("operatorId", "_id name")
      .populate("branchId", "_id name")
      .skip(skip)
      .limit(Number(limit));

    res.json({
      data: users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayCargoBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const balance = await getDailyCargoBalance(userId);
    res.json({ date: new Date().toISOString().slice(0, 10), balance });
  } catch (err) {
    console.error('Cargo balance error:', err.message);
    res.status(500).json({ error: 'Unable to calculate cargo balance' });
  }
};


