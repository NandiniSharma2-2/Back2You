const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  registerValidator, loginValidator, forgotPasswordValidator,
  resetPasswordValidator, changePasswordValidator,
} = require('../validators/auth.validator');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, validate, authController.resetPassword);
router.put('/change-password', authenticate, changePasswordValidator, validate, authController.changePassword);

module.exports = router;
