const router = require('express').Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/rooms', authenticate, chatController.getMyRooms);
router.post('/rooms', authenticate, chatController.getOrCreateRoom);
router.get('/rooms/:uuid/messages', authenticate, chatController.getMessages);
router.post('/rooms/:uuid/messages', authenticate, chatController.sendMessage);
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

module.exports = router;
