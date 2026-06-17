const { query } = require('../config/database');

class FoundItemRepository {
  async create(data) {
    const result = await query(
      `INSERT INTO found_items 
        (uuid, user_id, category_id, title, description, brand, color, location,
         latitude, longitude, date_found, time_found, storage_location, contact_email, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.uuid, data.userId, data.categoryId || null, data.title, data.description,
        data.brand || null, data.color || null, data.location,
        data.latitude || null, data.longitude || null,
        data.dateFound, data.timeFound || null, data.storageLocation || null,
        data.contactEmail || null, data.contactPhone || null,
      ]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const rows = await query(
      `SELECT fi.*, 
              u.username, u.first_name, u.last_name, u.avatar_url, u.is_verified as user_verified,
              c.name as category_name, c.icon as category_icon, c.color as category_color,
              v.username as verified_by_username
       FROM found_items fi
       LEFT JOIN users u ON fi.user_id = u.id
       LEFT JOIN categories c ON fi.category_id = c.id
       LEFT JOIN users v ON fi.verified_by = v.id
       WHERE fi.id = ? AND fi.deleted_at IS NULL`,
      [id]
    );
    if (!rows[0]) return null;

    const item = rows[0];
    item.images = await this.getImages(id);
    return item;
  }

  async findByUuid(uuid) {
    const rows = await query(
      'SELECT id FROM found_items WHERE uuid = ? AND deleted_at IS NULL',
      [uuid]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  }

  async getImages(itemId) {
    return query(
      'SELECT * FROM item_images WHERE item_type = ? AND item_id = ? ORDER BY is_primary DESC, id ASC',
      ['found', itemId]
    );
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const fieldMap = {
      title: data.title,
      description: data.description,
      category_id: data.categoryId,
      brand: data.brand,
      color: data.color,
      location: data.location,
      date_found: data.dateFound,
      time_found: data.timeFound,
      storage_location: data.storageLocation,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      status: data.status,
      is_verified: data.isVerified,
      verified_by: data.verifiedBy,
      matched_lost_item_id: data.matchedLostItemId,
    };

    for (const [field, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await query(`UPDATE found_items SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async softDelete(id) {
    await query(
      'UPDATE found_items SET deleted_at = NOW(), status = ? WHERE id = ?',
      ['archived', id]
    );
  }

  async incrementViews(id) {
    await query('UPDATE found_items SET views = views + 1 WHERE id = ?', [id]);
  }

  async findAll({ page = 1, limit = 10, search, category, status, userId, dateFrom, dateTo, location, sortBy = 'created_at', sortOrder = 'DESC' }) {
    let whereClause = 'WHERE fi.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND MATCH(fi.title, fi.description, fi.brand, fi.color, fi.location) AGAINST(? IN BOOLEAN MODE)';
      params.push(`*${search}*`);
    }

    if (category) {
      whereClause += ' AND fi.category_id = ?';
      params.push(parseInt(category));
    }

    if (status) {
      whereClause += ' AND fi.status = ?';
      params.push(status);
    }

    if (userId) {
      whereClause += ' AND fi.user_id = ?';
      params.push(parseInt(userId));
    }

    if (dateFrom) {
      whereClause += ' AND fi.date_found >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND fi.date_found <= ?';
      params.push(dateTo);
    }

    if (location) {
      whereClause += ' AND fi.location LIKE ?';
      params.push(`%${location}%`);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    const sortField = sortBy === 'date_found' ? 'fi.date_found' : 'fi.created_at';
    const sortDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Try a simpler approach without Promise.all to isolate the issue
    try {
      const items = await query(
        `SELECT fi.*,
                u.username, u.first_name, u.last_name, u.avatar_url,
                c.name as category_name, c.icon as category_icon,
                (SELECT url FROM item_images WHERE item_type = 'found' AND item_id = fi.id AND is_primary = 1 LIMIT 1) as primary_image
         FROM found_items fi
         LEFT JOIN users u ON fi.user_id = u.id
         LEFT JOIN categories c ON fi.category_id = c.id
         ${whereClause}
         ORDER BY ${sortField} ${sortDir}
         LIMIT ? OFFSET ?`,
        [...params, limitNum, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM found_items fi ${whereClause}`,
        params
      );

      return { items, total: countResult[0].total };
    } catch (error) {
      console.error('Repository error:', error);
      throw error;
    }
  }

  async findForMatching(lostItem) {
    return query(
      `SELECT fi.*, c.name as category_name
       FROM found_items fi
       LEFT JOIN categories c ON fi.category_id = c.id
       WHERE fi.deleted_at IS NULL 
         AND fi.status = 'available'
         AND (fi.category_id = ? OR fi.location LIKE ?)
       ORDER BY fi.created_at DESC
       LIMIT 50`,
      [lostItem.category_id, `%${lostItem.location?.split(',')[0] || ''}%`]
    );
  }

  async getStats() {
    const rows = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(status = 'available') as available,
        SUM(status = 'claimed') as claimed,
        SUM(status = 'returned') as returned,
        SUM(is_verified = 1) as verified
      FROM found_items WHERE deleted_at IS NULL
    `);
    return rows[0];
  }
}

module.exports = new FoundItemRepository();
