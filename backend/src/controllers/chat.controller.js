const chatRepository = require('../repositories/chat.repository');
const { AppError } = require('../middleware/error.middleware');

class ChatController {
  async getMyRooms(req, res, next) {
    try {
      const rooms = await chatRepository.getUserRooms(req.user.id);
      res.json({ success: true, data: { rooms } });
    } catch (error) {
      next(error);
    }
  }

  async getOrCreateRoom(req, res, next) {
    try {
      const { userId, claimId } = req.body;
      if (!userId) throw new AppError('Target user ID required.', 400);
      if (userId === req.user.id) throw new AppError('Cannot chat with yourself.', 400);

      const room = await chatRepository.findOrCreateRoom(req.user.id, parseInt(userId), claimId || null);
      res.json({ success: true, data: { room } });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const room = await chatRepository.findRoomByUuid(req.params.uuid);
      if (!room) throw new AppError('Chat room not found.', 404);

      const canAccess = await chatRepository.canAccessRoom(room.id, req.user.id);
      if (!canAccess) throw new AppError('Not authorized.', 403);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const messages = await chatRepository.getMessages(room.id, { page, limit });

      // Mark as read
      await chatRepository.markMessagesRead(room.id, req.user.id);

      res.json({ success: true, data: { messages: messages.reverse(), room } });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const room = await chatRepository.findRoomByUuid(req.params.uuid);
      if (!room) throw new AppError('Chat room not found.', 404);

      const canAccess = await chatRepository.canAccessRoom(room.id, req.user.id);
      if (!canAccess) throw new AppError('Not authorized.', 403);

      const { content, messageType } = req.body;

      const message = await chatRepository.sendMessage({
        roomId: room.id,
        senderId: req.user.id,
        content,
        messageType: messageType || 'text',
      });

      // Emit via socket (handled in socket module)
      const io = req.app.get('io');
      if (io) {
        const otherUserId = room.participant1_id === req.user.id
          ? room.participant2_id
          : room.participant1_id;

        io.to(`user:${otherUserId}`).emit('new_message', {
          roomId: room.id,
          roomUuid: room.uuid,
          message,
        });
      }

      res.status(201).json({ success: true, data: { message } });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req, res, next) {
    try {
      await chatRepository.deleteMessage(req.params.messageId, req.user.id);
      res.json({ success: true, message: 'Message deleted.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
