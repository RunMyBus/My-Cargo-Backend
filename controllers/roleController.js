const Role = require('../models/Role');
const Permission = require('../models/Permission');



// Create a new role
exports.createRole = async (req, res) => {
    try {
        const { rolecode, rolename, description, permissions } = req.body;

        const existing = await Role.findOne({ rolecode });
        if (existing) {
            return res.status(400).json({ message: 'Role code already exists' });
        }

        const role = new Role({ rolecode, rolename, description, permissions });
        await role.save();

        res.status(201).json({ message: 'Role created successfully', role });
    } catch (error) {
        console.error('CREATE_ROLE_ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all roles
exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.find().populate('permissions');
        res.status(200).json({ roles });
    } catch (error) {
        console.error('GET_ROLES_ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.searchRoles = async (req, res) => {
    try {
        const { keyword = '', page = 1, limit = 10 } = req.query;

        const query = {
            $or: [
                { rolecode: { $regex: keyword, $options: 'i' } },
                { rolename: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        };

        const total = await Role.countDocuments(query);
        const roles = await Role.find(query)
            .populate('permissions')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            total,
            page: parseInt(page),
            pageSize: roles.length,
            roles
        });
    } catch (error) {
        console.error('SEARCH_ROLES_ERROR:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a single role by ID
exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id).populate('permissions');
        if (!role) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json({ role });
    } catch (error) {
        console.error('GET_ROLE_ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a role
exports.updateRole = async (req, res) => {

    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Missing or empty request body" });
        }

        const { rolecode, rolename, description, permissions } = req.body;

        const role = await Role.findByIdAndUpdate(
            req.params.id,
            { rolecode, rolename, description, permissions },
            { new: true }
        );

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.status(200).json(role);
    } catch (error) {
        console.error('UPDATE_ROLE_ERROR:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// Delete a role
exports.deleteRole = async (req, res) => {
    try {
        const deleted = await Role.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Role not found' });

        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('DELETE_ROLE_ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

