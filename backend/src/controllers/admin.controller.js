const analyticsService = require('../services/analytics.service');
const { query } = require('../config/database');
const { paginate, paginateResponse, slugify } = require('../utils/helpers');
const { AppError } = require('../middleware/error.middleware');

class AdminController {
  // Dashboard stats
  async getDashboard(req, res, next) {
    try {
      const stats = await analyticsService.getDashboardStats();
      const recentActivity = await analyticsService.getRecentActivity(10);
      const categoryStats = await analyticsService.getCategoryStats();

      res.json({
        success: true,
        data: { stats, recentActivity, categoryStats },
      });
    } catch (error) {
      next(error);
    }
  }

  async getGrowthData(req, res, next) {
    try {
      const data = await analyticsService.getGrowthData(req.query.period);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getLocationStats(req, res, next) {
    try {
      const data = await analyticsService.getLocationStats();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getClaimStats(req, res, next) {
    try {
      const data = await analyticsService.getClaimStats();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Categories CRUD
  async getCategories(req, res, next) {
    try {
      const categories = await query(`
        SELECT c.*, 
               COUNT(DISTINCT li.id) as lost_count,
               COUNT(DISTINCT fi.id) as found_count
        FROM categories c
        LEFT JOIN lost_items li ON li.category_id = c.id AND li.deleted_at IS NULL
        LEFT JOIN found_items fi ON fi.category_id = c.id AND fi.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `);
      res.json({ success: true, data: { categories } });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { name, description, icon, color, sortOrder } = req.body;
      const slug = slugify(name);

      const result = await query(
        'INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [name, slug, description || null, icon || '📦', color || '#00F0FF', sortOrder || 0]
      );

      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'create_category', 'category', result.insertId]
      );

      const categories = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, data: { category: categories[0] } });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { name, description, icon, color, sortOrder, isActive } = req.body;
      const categories = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
      if (!categories.length) throw new AppError('Category not found.', 404);

      await query(
        `UPDATE categories SET 
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [name, description, icon, color, sortOrder, isActive, req.params.id]
      );

      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'update_category', 'category', req.params.id]
      );

      const updated = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
      res.json({ success: true, data: { category: updated[0] } });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await query('UPDATE categories SET is_active = 0 WHERE id = ?', [req.params.id]);
      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'delete_category', 'category', req.params.id]
      );
      res.json({ success: true, message: 'Category deactivated.' });
    } catch (error) {
      next(error);
    }
  }

  // System Settings
  async getSettings(req, res, next) {
    try {
      const settings = await query('SELECT * FROM system_settings ORDER BY setting_key');
      res.json({ success: true, data: { settings } });
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const { value } = req.body;
      await query(
        'UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
        [value, req.user.id, req.params.key]
      );

      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, notes) VALUES (?, ?, ?, ?)',
        [req.user.id, 'update_setting', 'setting', `Updated ${req.params.key} to ${value}`]
      );

      res.json({ success: true, message: 'Setting updated.' });
    } catch (error) {
      next(error);
    }
  }

  // Audit Logs
  async getAuditLogs(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const offset = (page - 1) * limit;

      const [logs, countResult] = await Promise.all([
        query(
          `SELECT al.*, u.username, u.first_name, u.last_name, u.avatar_url
           FROM audit_logs al
           LEFT JOIN users u ON al.admin_id = u.id
           ORDER BY al.created_at DESC
           LIMIT ? OFFSET ?`,
          [limit, offset]
        ),
        query('SELECT COUNT(*) as total FROM audit_logs'),
      ]);

      res.json({
        success: true,
        ...paginateResponse(logs, countResult[0].total, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  // Reports management
  async getReports(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const { status } = req.query;
      const offset = (page - 1) * limit;

      let where = 'WHERE 1=1';
      const params = [];

      if (status) {
        where += ' AND r.status = ?';
        params.push(status);
      }

      const [reports, countResult] = await Promise.all([
        query(
          `SELECT r.*, u.username as reporter_username, u.avatar_url as reporter_avatar
           FROM reports r
           LEFT JOIN users u ON r.reporter_id = u.id
           ${where}
           ORDER BY r.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        ),
        query(`SELECT COUNT(*) as total FROM reports r ${where}`, params),
      ]);

      res.json({
        success: true,
        ...paginateResponse(reports, countResult[0].total, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req, res, next) {
    try {
      const { status, reviewNotes } = req.body;
      await query(
        'UPDATE reports SET status = ?, reviewed_by = ?, review_notes = ? WHERE id = ?',
        [status, req.user.id, reviewNotes, req.params.id]
      );
      res.json({ success: true, message: 'Report resolved.' });
    } catch (error) {
      next(error);
    }
  }

  // Public categories (no auth required)
  async getPublicCategories(req, res, next) {
    try {
      const categories = await query(
        'SELECT id, name, slug, icon, color, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
      );
      res.json({ success: true, data: { categories } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
