const Branch = require('../models/Branch'); // adjust path as needed

// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    const { name, address, phone, manager, status } = req.body;

    const branch = new Branch({
      name,
      address,
      phone,
      manager,
      status: status?.toLowerCase() || 'active'
    });

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
    const total = await Branch.countDocuments();

    res.status(200).json({
      data: branches,
      total,
    });
  } catch (error) {
    console.error('GET_BRANCHES_ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a branch by ID
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
    const { name, address, phone, manager, status } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, manager, status },
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


// Search branches with pagination and name query
exports.searchBranches = async (req, res) => {
  try {
    const { query = "", limit = 10, page = 1 } = req.body;

    // Build case-insensitive regex search for the name field
    const searchCondition = {
      name: { $regex: query, $options: "i" },
    };

    const skip = (page - 1) * limit;

    const total = await Branch.countDocuments(searchCondition);

    const branches = await Branch.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: branches,
    });
  } catch (error) {
    console.error("SEARCH_BRANCHES_ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
