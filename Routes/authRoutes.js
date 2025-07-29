const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const { authLimiter } = require('../middleware/security');
const { validate } = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validations/authValidation');

router.post('/register', authLimiter, validate(registerSchema), authController.register);

router.post('/login', authLimiter, validate(loginSchema), passport.authenticate('local', { session: true }), async (req, res) => {
    await authController.login(req, res);
});

module.exports = router;
