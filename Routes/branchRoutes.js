const express = require('express');
const passport = require('passport');
const router = express.Router();
const branchController = require('../controllers/branchController');

router.use(passport.authenticate('jwt', { session: false }));

router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranchById);
router.post('/', branchController.createBranch);
router.post("/search", branchController.searchBranches);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router;
