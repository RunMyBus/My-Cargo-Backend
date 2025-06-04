const Branch = require('../models/Branch');

// Create Branch
exports.createBranch = async (req, res) => {
  try {
    const { branchId, name, address, phone, manager, status } = req.body;

    const existing = await Branch.findOne({ branchId });
    if (existing) {
      return res.status(400).json({ message: 'Branch ID already exists' });
    }

    const branch = new Branch({ branchId, name, address, phone, manager, status });
    await branch.save();

    res.status(201).json(branch);
  } catch (error) {
    console.error('CREATE_BRANCH_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all branches
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json(branches);
  } catch (error) {
    console.error('GET_BRANCHES_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get branch by ID
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.status(200).json(branch);
  } catch (error) {
    console.error('GET_BRANCH_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    const { branchId, name, address, phone, manager, status } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { branchId, name, address, phone, manager, status },
      { new: true }
    );

    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    res.status(200).json(branch);
  } catch (error) {
    console.error('UPDATE_BRANCH_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('DELETE_BRANCH_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
