const express = require('express');
const router = express.Router(); 
const authRoutes = require('./authRoutes');
const roleRoutes = require('./roleRoutes');
const branchRoutes = require('./branchRoutes');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/branches', branchRoutes);
router.use('/users', userRoutes);

module.exports = router;