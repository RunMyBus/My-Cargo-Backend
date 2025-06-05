const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('role');
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
    const { fullName, mobile, password, role, status } = req.body;

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }

    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      mobile,
      password: hashedPassword,
      role,
      status
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
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

    const total = await User.countDocuments({ fullName: regex });
    const users = await User.find({ fullName: regex })
      .populate("role")
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

