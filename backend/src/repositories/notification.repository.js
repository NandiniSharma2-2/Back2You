const { query } = require('../config/database');

class NotificationRepository {
  async create({ userId, type, title, message, data = null, actionUrl = null }) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data, action_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null, actionUrl]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const rows = await query('SELECT * FROM notifications WHERE id = ?', [id]);
    if (rows[0] && rows[0].data) {
      try { rows[0].data = JSON.parse(rows[0].data); } catch {}
    }
    return rows[0] || null;
  }

  async findByUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly) {
      whereClause += ' AND is_read = 0';
    }

    const offset = (page - 1) * limit;
    const [notifications, countResult, unreadCount] = await Promise.all([
      query(
        `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) as total FROM notifications ${whereClause}`, params),
      query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]),
    ]);

    notifications.forEach(n => {
      if (n.data) {
        try { n.data = JSON.parse(n.data); } catch {}
      }
    });

    return {
      notifications,
      total: countResult[0].total,
      unreadCount: unreadCount[0].count,
    };
  }

  async markAsRead(id, userId) {
    await query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  async markAllAsRead(userId) {
    await query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [userId]
    );
  }

  async delete(id, userId) {
    await query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getUnreadCount(userId) {
    const rows = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return rows[0].count;
  }
}

module.exports = new NotificationRepository();
