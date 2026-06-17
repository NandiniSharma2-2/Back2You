const { query, transaction } = require('../config/database');

class LostItemRepository {
  async create(data) {
    const result = await query(
      `INSERT INTO lost_items 
        (uuid, user_id, category_id, title, description, brand, color, location, 
         latitude, longitude, date_lost, time_lost, reward, contact_email, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.uuid, data.userId, data.categoryId || null, data.title, data.description,
        data.brand || null, data.color || null, data.location,
        data.latitude || null, data.longitude || null,
        data.dateLost, data.timeLost || null,
        data.reward || 0, data.contactEmail || null, data.contactPhone || null,
      ]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const rows = await query(
      `SELECT li.*, 
              u.username, u.first_name, u.last_name, u.avatar_url, u.is_verified as user_verified,
              c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM lost_items li
       LEFT JOIN users u ON li.user_id = u.id
       LEFT JOIN categories c ON li.category_id = c.id
       WHERE li.id = ? AND li.deleted_at IS NULL`,
      [id]
    );
    if (!rows[0]) return null;

    const item = rows[0];
    item.images = await this.getImages(id);
    return item;
  }

  async findByUuid(uuid) {
    const rows = await query(
      `SELECT li.* FROM lost_items li WHERE li.uuid = ? AND li.deleted_at IS NULL`,
      [uuid]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  }

  async getImages(itemId) {
    return query(
      'SELECT * FROM item_images WHERE item_type = ? AND item_id = ? ORDER BY is_primary DESC, id ASC',
      ['lost', itemId]
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
      latitude: data.latitude,
      longitude: data.longitude,
      date_lost: data.dateLost,
      time_lost: data.timeLost,
      reward: data.reward,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      status: data.status,
      is_featured: data.isFeatured,
      matched_found_item_id: data.matchedFoundItemId,
    };

    for (const [field, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await query(`UPDATE lost_items SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async softDelete(id) {
    await query(
      'UPDATE lost_items SET deleted_at = NOW(), status = ? WHERE id = ?',
      ['closed', id]
    );
  }

  async incrementViews(id) {
    await query('UPDATE lost_items SET views = views + 1 WHERE id = ?', [id]);
  }

  async findAll({ page = 1, limit = 10, search, category, status, userId, dateFrom, dateTo, location, sortBy = 'created_at', sortOrder = 'DESC' }) {
    let whereClause = 'WHERE li.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND MATCH(li.title, li.description, li.brand, li.color, li.location) AGAINST(? IN BOOLEAN MODE)';
      params.push(`*${search}*`);
    }

    if (category) {
      whereClause += ' AND li.category_id = ?';
      params.push(parseInt(category));
    }

    if (status) {
      whereClause += ' AND li.status = ?';
      params.push(status);
    }

    if (userId) {
      whereClause += ' AND li.user_id = ?';
      params.push(parseInt(userId));
    }

    if (dateFrom) {
      whereClause += ' AND li.date_lost >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND li.date_lost <= ?';
      params.push(dateTo);
    }

    if (location) {
      whereClause += ' AND li.location LIKE ?';
      params.push(`%${location}%`);
    }

    const allowedSort = ['created_at', 'date_lost', 'views', 'reward', 'title'];
    const sortField = allowedSort.includes(sortBy) ? `li.${sortBy}` : 'li.created_at';
    const sortDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
      const items = await query(
        `SELECT li.*, 
                u.username, u.first_name, u.last_name, u.avatar_url,
                c.name as category_name, c.icon as category_icon,
                (SELECT url FROM item_images WHERE item_type = 'lost' AND item_id = li.id AND is_primary = 1 LIMIT 1) as primary_image
         FROM lost_items li
         LEFT JOIN users u ON li.user_id = u.id
         LEFT JOIN categories c ON li.category_id = c.id
         ${whereClause}
         ORDER BY ${sortField} ${sortDir}
         LIMIT ? OFFSET ?`,
        [...params, limitNum, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM lost_items li LEFT JOIN categories c ON li.category_id = c.id ${whereClause}`,
        params
      );

      return { items, total: countResult[0].total };
    } catch (error) {
      console.error('Lost Items Repository error:', error);
      throw error;
    }
  }

  async findForMatching(foundItem) {
    return query(
      `SELECT li.*, c.name as category_name
       FROM lost_items li
       LEFT JOIN categories c ON li.category_id = c.id
       WHERE li.deleted_at IS NULL 
         AND li.status = 'active'
         AND (li.category_id = ? OR li.location LIKE ?)
       ORDER BY li.created_at DESC
       LIMIT 50`,
      [foundItem.category_id, `%${foundItem.location?.split(',')[0] || ''}%`]
    );
  }

  async getStats() {
    const rows = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(status = 'active') as active,
        SUM(status = 'matched') as matched,
        SUM(status = 'recovered') as recovered,
        SUM(status = 'closed') as closed
      FROM lost_items WHERE deleted_at IS NULL
    `);
    return rows[0];
  }
}

module.exports = new LostItemRepository();
