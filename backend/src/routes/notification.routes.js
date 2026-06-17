const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, notificationController.getAll);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/read-all', authenticate, notificationController.markAllRead);
router.put('/:id/read', authenticate, notificationController.markRead);
router.delete('/:id', authenticate, notificationController.delete);

module.exports = router;
