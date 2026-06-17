const { query } = require('../config/database');

class AnalyticsService {
  async getDashboardStats() {
    const [users, lostItems, foundItems, claims, recoveryRate] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(is_active = 1) as active,
          SUM(is_verified = 1) as verified,
          SUM(DATE(created_at) = CURDATE()) as today
        FROM users WHERE deleted_at IS NULL
      `),
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(status = 'active') as active,
          SUM(status = 'recovered') as recovered,
          SUM(DATE(created_at) = CURDATE()) as today
        FROM lost_items WHERE deleted_at IS NULL
      `),
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(status = 'available') as available,
          SUM(status = 'returned') as returned,
          SUM(DATE(created_at) = CURDATE()) as today
        FROM found_items WHERE deleted_at IS NULL
      `),
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(status = 'approved') as approved,
          SUM(status = 'pending') as pending,
          SUM(DATE(created_at) = CURDATE()) as today
        FROM claims
      `),
      query(`
        SELECT 
          ROUND(
            (SUM(CASE WHEN status = 'recovered' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 1
          ) as rate
        FROM lost_items WHERE deleted_at IS NULL
      `),
    ]);

    return {
      users: users[0],
      lostItems: lostItems[0],
      foundItems: foundItems[0],
      claims: claims[0],
      recoveryRate: recoveryRate[0]?.rate || 0,
    };
  }

  async getGrowthData(period = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    const [userGrowth, itemGrowth] = await Promise.all([
      query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [days]),
      query(`
        SELECT 
          DATE(created_at) as date,
          SUM(1) as total,
          SUM(CASE WHEN type = 'lost' THEN 1 ELSE 0 END) as lost_count,
          SUM(CASE WHEN type = 'found' THEN 1 ELSE 0 END) as found_count
        FROM (
          SELECT created_at, 'lost' as type FROM lost_items WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL
          UNION ALL
          SELECT created_at, 'found' as type FROM found_items WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL
        ) combined
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [days, days]),
    ]);

    return { userGrowth, itemGrowth };
  }

  async getCategoryStats() {
    return query(`
      SELECT 
        c.name, c.icon, c.color,
        COUNT(DISTINCT li.id) as lost_count,
        COUNT(DISTINCT fi.id) as found_count,
        COUNT(DISTINCT CASE WHEN li.status = 'recovered' THEN li.id END) as recovered_count
      FROM categories c
      LEFT JOIN lost_items li ON li.category_id = c.id AND li.deleted_at IS NULL
      LEFT JOIN found_items fi ON fi.category_id = c.id AND fi.deleted_at IS NULL
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY (lost_count + found_count) DESC
    `);
  }

  async getLocationStats() {
    return query(`
      SELECT 
        SUBSTRING_INDEX(location, ',', 1) as city,
        COUNT(*) as total_reports
      FROM (
        SELECT location FROM lost_items WHERE deleted_at IS NULL AND location IS NOT NULL
        UNION ALL
        SELECT location FROM found_items WHERE deleted_at IS NULL AND location IS NOT NULL
      ) locations
      WHERE location != ''
      GROUP BY city
      ORDER BY total_reports DESC
      LIMIT 10
    `);
  }

  async getClaimStats() {
    return query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(status = 'approved') as approved,
        SUM(status = 'rejected') as rejected,
        ROUND(SUM(status = 'approved') / COUNT(*) * 100, 1) as approval_rate
      FROM claims
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);
  }

  async getRecentActivity(limit = 20) {
    return query(`
      SELECT al.*, u.username, u.avatar_url
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [limit]);
  }

  async getTopRecoveries() {
    return query(`
      SELECT 
        li.title, li.location, li.date_lost,
        u.username as owner,
        fu.username as finder,
        li.updated_at as recovered_at,
        (SELECT url FROM item_images WHERE item_type = 'lost' AND item_id = li.id AND is_primary = 1 LIMIT 1) as image
      FROM lost_items li
      JOIN users u ON li.user_id = u.id
      LEFT JOIN item_matches im ON im.lost_item_id = li.id
      LEFT JOIN found_items fi ON im.found_item_id = fi.id
      LEFT JOIN users fu ON fi.user_id = fu.id
      WHERE li.status = 'recovered'
      ORDER BY li.updated_at DESC
      LIMIT 6
    `);
  }
}

module.exports = new AnalyticsService();
