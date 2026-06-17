const { query } = require('../config/database');
const logger = require('../utils/logger');

function logActivity(action, resourceType = null) {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);

    res.json = async function (data) {
      if (res.statusCode < 400) {
        try {
          await query(
            `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description, ip_address, user_agent, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user?.id || null,
              action,
              resourceType,
              data?.data?.id || null,
              `${action} via ${req.method} ${req.path}`,
              req.ip,
              req.headers['user-agent'],
              JSON.stringify({ params: req.params, query: req.query }),
            ]
          );
        } catch (err) {
          logger.warn('Activity log failed:', err.message);
        }
      }
      return originalSend(data);
    };

    next();
  };
}

module.exports = { logActivity };
