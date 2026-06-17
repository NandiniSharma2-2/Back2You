const { query } = require('../config/database');

class ChatRepository {
  async findOrCreateRoom(participant1Id, participant2Id, claimId = null) {
    // Ensure consistent ordering
    const [p1, p2] = participant1Id < participant2Id
      ? [participant1Id, participant2Id]
      : [participant2Id, participant1Id];

    let rooms = await query(
      `SELECT * FROM chat_rooms 
       WHERE ((participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?))
       AND is_active = 1`,
      [p1, p2, p2, p1]
    );

    if (rooms.length > 0) return rooms[0];

    const { v4: uuidv4 } = require('uuid');
    const result = await query(
      `INSERT INTO chat_rooms (uuid, claim_id, participant1_id, participant2_id) VALUES (?, ?, ?, ?)`,
      [uuidv4(), claimId || null, p1, p2]
    );

    return this.findRoomById(result.insertId);
  }

  async findRoomById(id) {
    const rows = await query(
      `SELECT cr.*,
              u1.username as p1_username, u1.first_name as p1_first_name, u1.avatar_url as p1_avatar,
              u2.username as p2_username, u2.first_name as p2_first_name, u2.avatar_url as p2_avatar,
              m.content as last_message_content, m.created_at as last_message_time
       FROM chat_rooms cr
       LEFT JOIN users u1 ON cr.participant1_id = u1.id
       LEFT JOIN users u2 ON cr.participant2_id = u2.id
       LEFT JOIN messages m ON cr.last_message_id = m.id
       WHERE cr.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findRoomByUuid(uuid) {
    const rows = await query('SELECT id FROM chat_rooms WHERE uuid = ?', [uuid]);
    if (!rows[0]) return null;
    return this.findRoomById(rows[0].id);
  }

  async getUserRooms(userId) {
    return query(
      `SELECT cr.*,
              CASE WHEN cr.participant1_id = ? THEN u2.username ELSE u1.username END as other_username,
              CASE WHEN cr.participant1_id = ? THEN u2.first_name ELSE u1.first_name END as other_first_name,
              CASE WHEN cr.participant1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END as other_avatar,
              CASE WHEN cr.participant1_id = ? THEN u2.id ELSE u1.id END as other_user_id,
              m.content as last_message_content, m.created_at as last_message_time,
              (SELECT COUNT(*) FROM messages WHERE room_id = cr.id AND sender_id != ? AND is_read = 0 AND is_deleted = 0) as unread_count
       FROM chat_rooms cr
       LEFT JOIN users u1 ON cr.participant1_id = u1.id
       LEFT JOIN users u2 ON cr.participant2_id = u2.id
       LEFT JOIN messages m ON cr.last_message_id = m.id
       WHERE (cr.participant1_id = ? OR cr.participant2_id = ?) AND cr.is_active = 1
       ORDER BY COALESCE(m.created_at, cr.created_at) DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );
  }

  async getMessages(roomId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    return query(
      `SELECT m.*, u.username, u.first_name, u.avatar_url
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.room_id = ? AND m.is_deleted = 0
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [roomId, limit, offset]
    );
  }

  async sendMessage({ roomId, senderId, content, messageType = 'text', attachmentUrl = null }) {
    const result = await query(
      `INSERT INTO messages (room_id, sender_id, content, message_type, attachment_url) VALUES (?, ?, ?, ?, ?)`,
      [roomId, senderId, content, messageType, attachmentUrl]
    );

    await query(
      'UPDATE chat_rooms SET last_message_id = ?, last_message_at = NOW() WHERE id = ?',
      [result.insertId, roomId]
    );

    const rows = await query(
      `SELECT m.*, u.username, u.first_name, u.avatar_url
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );
    return rows[0];
  }

  async markMessagesRead(roomId, userId) {
    await query(
      'UPDATE messages SET is_read = 1, read_at = NOW() WHERE room_id = ? AND sender_id != ? AND is_read = 0',
      [roomId, userId]
    );
  }

  async deleteMessage(messageId, userId) {
    await query(
      'UPDATE messages SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND sender_id = ?',
      [messageId, userId]
    );
  }

  async canAccessRoom(roomId, userId) {
    const rows = await query(
      'SELECT id FROM chat_rooms WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
      [roomId, userId, userId]
    );
    return rows.length > 0;
  }
}

module.exports = new ChatRepository();
