const userRepository = require('../repositories/user.repository');
const { sanitizeUser, paginate, paginateResponse } = require('../utils/helpers');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload.middleware');
const { AppError } = require('../middleware/error.middleware');

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await userRepository.findByUuid(req.params.uuid);
      if (!user) throw new AppError('User not found.', 404);
      res.json({ success: true, data: { user: sanitizeUser(user) } });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone, bio, location } = req.body;
      const user = await userRepository.update(req.user.id, {
        firstName, lastName, phone, bio, location,
      });
      res.json({ success: true, message: 'Profile updated.', data: { user: sanitizeUser(user) } });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded.', 400);

      const user = await userRepository.findById(req.user.id);

      // Delete old avatar from cloudinary
      if (user.avatar_public_id) {
        await deleteFromCloudinary(user.avatar_public_id);
      }

      const result = await uploadToCloudinary(req.file.path, 'avatars', {
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        ],
      });

      const updated = await userRepository.update(req.user.id, {
        avatarUrl: result.url,
        avatarPublicId: result.publicId,
      });

      res.json({
        success: true,
        message: 'Avatar updated.',
        data: { user: sanitizeUser(updated) },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req, res, next) {
    try {
      const { query } = require('../config/database');
      const userId = req.user.id;

      const [lostStats, foundStats, claimStats] = await Promise.all([
        query(`
          SELECT 
            COUNT(*) as total,
            SUM(status = 'active') as active,
            SUM(status = 'recovered') as recovered
          FROM lost_items WHERE user_id = ? AND deleted_at IS NULL
        `, [userId]),
        query(`
          SELECT 
            COUNT(*) as total,
            SUM(status = 'available') as available,
            SUM(status = 'returned') as returned
          FROM found_items WHERE user_id = ? AND deleted_at IS NULL
        `, [userId]),
        query(`
          SELECT COUNT(*) as total, SUM(status = 'approved') as approved
          FROM claims WHERE claimant_id = ?
        `, [userId]),
      ]);

      res.json({
        success: true,
        data: {
          lostItems: lostStats[0],
          foundItems: foundStats[0],
          claims: claimStats[0],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get all users
  async getAllUsers(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const { search, role, status } = req.query;

      const { users, total } = await userRepository.findAll({ page, limit, search, role, status });

      res.json({
        success: true,
        ...paginateResponse(users, total, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Update user role
  async updateUserRole(req, res, next) {
    try {
      const { roleId } = req.body;
      const { query } = require('../config/database');

      // Validate role
      const roles = await query('SELECT id FROM roles WHERE id = ?', [roleId]);
      if (!roles.length) throw new AppError('Invalid role.', 400);

      // Prevent demoting super admins unless you're a super admin
      const targetUser = await userRepository.findByUuid(req.params.uuid);
      if (!targetUser) throw new AppError('User not found.', 404);

      if (targetUser.role_name === 'super_admin' && req.user.role_name !== 'super_admin') {
        throw new AppError('Cannot modify super administrator.', 403);
      }

      await userRepository.update(targetUser.id, { roleId });

      // Audit log
      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'update_role', 'user', targetUser.id,
         JSON.stringify({ role: targetUser.role_name }),
         JSON.stringify({ roleId })]
      );

      res.json({ success: true, message: 'User role updated.' });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Suspend user
  async suspendUser(req, res, next) {
    try {
      const { reason } = req.body;
      const { query } = require('../config/database');

      const targetUser = await userRepository.findByUuid(req.params.uuid);
      if (!targetUser) throw new AppError('User not found.', 404);

      await userRepository.update(targetUser.id, {
        isSuspended: true,
        suspensionReason: reason,
      });

      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id, notes) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'suspend_user', 'user', targetUser.id, reason]
      );

      res.json({ success: true, message: 'User suspended.' });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Ban user
  async banUser(req, res, next) {
    try {
      const { reason } = req.body;
      const { query } = require('../config/database');

      const targetUser = await userRepository.findByUuid(req.params.uuid);
      if (!targetUser) throw new AppError('User not found.', 404);

      await userRepository.update(targetUser.id, {
        isBanned: true,
        banReason: reason,
        isActive: false,
      });

      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id, notes) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'ban_user', 'user', targetUser.id, reason]
      );

      res.json({ success: true, message: 'User banned.' });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Unsuspend/unban user
  async reinstateUser(req, res, next) {
    try {
      const { query } = require('../config/database');
      const targetUser = await userRepository.findByUuid(req.params.uuid);
      if (!targetUser) throw new AppError('User not found.', 404);

      await userRepository.update(targetUser.id, {
        isSuspended: false,
        isBanned: false,
        isActive: true,
        suspensionReason: null,
        banReason: null,
      });

      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'reinstate_user', 'user', targetUser.id]
      );

      res.json({ success: true, message: 'User reinstated.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
