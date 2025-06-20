const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
        rolename: { type: String, required: true },
        description: { type: String, required: true },
        permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
        operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator'},
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }     
    });
    
module.exports = mongoose.model('Role', roleSchema);