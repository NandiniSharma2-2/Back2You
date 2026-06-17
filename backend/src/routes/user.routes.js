const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

router.get('/me/stats', authenticate, userController.getUserStats);
router.put('/me', authenticate, userController.updateProfile);
router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.get('/:uuid', authenticate, userController.getProfile);

// Admin routes
router.get('/', authenticate, authorize('admin', 'super_admin'), userController.getAllUsers);
router.put('/:uuid/role', authenticate, authorize('admin', 'super_admin'), userController.updateUserRole);
router.put('/:uuid/suspend', authenticate, authorize('admin', 'super_admin', 'moderator'), userController.suspendUser);
router.put('/:uuid/ban', authenticate, authorize('admin', 'super_admin'), userController.banUser);
router.put('/:uuid/reinstate', authenticate, authorize('admin', 'super_admin'), userController.reinstateUser);

module.exports = router;
