const notificationRepository = require('../repositories/notification.repository');
const { paginate, paginateResponse } = require('../utils/helpers');

class NotificationController {
  async getAll(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await notificationRepository.findByUser(req.user.id, {
        page, limit, unreadOnly,
      });

      res.json({
        success: true,
        ...paginateResponse(result.notifications, result.total, page, limit),
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      await notificationRepository.markAsRead(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      await notificationRepository.markAllAsRead(req.user.id);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await notificationRepository.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification deleted.' });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationRepository.getUnreadCount(req.user.id);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
