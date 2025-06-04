const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
        rolecode: { type: String, required: false, unique: true },
        rolename: { type: String, required: true },
        description: { type: String, required: true },
        permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    });
    
module.exports = mongoose.model('Role', roleSchema);