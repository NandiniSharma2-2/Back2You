const { query, transaction } = require('../config/database');

class UserRepository {
  async findById(id) {
    const rows = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email) {
    const rows = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ? AND u.deleted_at IS NULL`,
      [email]
    );
    return rows[0] || null;
  }

  async findByUsername(username) {
    const rows = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ? AND u.deleted_at IS NULL`,
      [username]
    );
    return rows[0] || null;
  }

  async findByUuid(uuid) {
    const rows = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.uuid = ? AND u.deleted_at IS NULL`,
      [uuid]
    );
    return rows[0] || null;
  }

  async create(data) {
    const result = await query(
      `INSERT INTO users (uuid, username, email, password, first_name, last_name, phone, role_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.uuid, data.username, data.email, data.password, data.firstName, data.lastName, data.phone || null, data.roleId || 2]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      bio: data.bio,
      location: data.location,
      avatar_url: data.avatarUrl,
      avatar_public_id: data.avatarPublicId,
      is_verified: data.isVerified,
      is_active: data.isActive,
      is_suspended: data.isSuspended,
      is_banned: data.isBanned,
      suspension_reason: data.suspensionReason,
      ban_reason: data.banReason,
      password: data.password,
      failed_login_attempts: data.failedLoginAttempts,
      locked_until: data.lockedUntil,
      last_login: data.lastLogin,
      last_active: data.lastActive,
      role_id: data.roleId,
    };

    for (const [field, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async softDelete(id) {
    await query(
      'UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ?',
      [id]
    );
  }

  async findAll({ page = 1, limit = 10, search, role, status }) {
    let whereClause = 'WHERE u.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      whereClause += ' AND r.name = ?';
      params.push(role);
    }

    if (status === 'active') whereClause += ' AND u.is_active = 1 AND u.is_suspended = 0';
    if (status === 'suspended') whereClause += ' AND u.is_suspended = 1';
    if (status === 'banned') whereClause += ' AND u.is_banned = 1';

    const offset = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      query(
        `SELECT u.id, u.uuid, u.username, u.email, u.first_name, u.last_name, 
                u.avatar_url, u.is_verified, u.is_active, u.is_suspended, u.is_banned,
                u.last_login, u.created_at, r.name as role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id ${whereClause}`,
        params
      ),
    ]);

    return { users, total: countResult[0].total };
  }

  async getStats() {
    const [total, active, verified, byRole] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM users WHERE is_verified = 1 AND deleted_at IS NULL'),
      query(`
        SELECT r.name, COUNT(u.id) as count 
        FROM roles r 
        LEFT JOIN users u ON u.role_id = r.id AND u.deleted_at IS NULL 
        GROUP BY r.id, r.name
      `),
    ]);

    return {
      total: total[0].count,
      active: active[0].count,
      verified: verified[0].count,
      byRole,
    };
  }
}

module.exports = new UserRepository();
