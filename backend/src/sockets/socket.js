const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const chatRepository = require('../repositories/chat.repository');
const logger = require('../utils/logger');

function initializeSocket(io) {
  // Auth middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await query(
        `SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = 1`,
        [decoded.userId]
      );

      if (!users.length) {
        return next(new Error('User not found'));
      }

      socket.user = users[0];
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    logger.info(`Socket connected: user ${userId}`);

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // Update last active
    query('UPDATE users SET last_active = NOW() WHERE id = ?', [userId]).catch(() => {});

    // Join chat rooms
    socket.on('join_room', async (roomUuid) => {
      try {
        const room = await chatRepository.findRoomByUuid(roomUuid);
        if (!room) return;

        const canAccess = await chatRepository.canAccessRoom(room.id, userId);
        if (canAccess) {
          socket.join(`room:${room.id}`);
          socket.emit('room_joined', { roomId: room.id, roomUuid });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send message via socket
    socket.on('send_message', async ({ roomUuid, content, messageType = 'text' }) => {
      try {
        const room = await chatRepository.findRoomByUuid(roomUuid);
        if (!room) return;

        const canAccess = await chatRepository.canAccessRoom(room.id, userId);
        if (!canAccess) return;

        const message = await chatRepository.sendMessage({
          roomId: room.id,
          senderId: userId,
          content,
          messageType,
        });

        // Broadcast to room participants
        io.to(`room:${room.id}`).emit('new_message', {
          roomId: room.id,
          roomUuid,
          message,
        });

        // Notify if other user not in room
        const otherUserId = room.participant1_id === userId
          ? room.participant2_id
          : room.participant1_id;

        io.to(`user:${otherUserId}`).emit('message_notification', {
          roomId: room.id,
          roomUuid,
          from: socket.user.username,
          preview: content.substring(0, 50),
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ roomUuid }) => {
      socket.to(`room:${roomUuid}`).emit('user_typing', {
        userId,
        username: socket.user.username,
      });
    });

    socket.on('typing_stop', ({ roomUuid }) => {
      socket.to(`room:${roomUuid}`).emit('user_stopped_typing', { userId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ roomUuid }) => {
      try {
        const room = await chatRepository.findRoomByUuid(roomUuid);
        if (room) {
          await chatRepository.markMessagesRead(room.id, userId);
          socket.to(`room:${room.id}`).emit('messages_read', { userId, roomUuid });
        }
      } catch {}
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user ${userId}`);
      query('UPDATE users SET last_active = NOW() WHERE id = ?', [userId]).catch(() => {});
    });
  });

  return io;
}

module.exports = { initializeSocket };
