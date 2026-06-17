const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const isAdmin = authorize('admin', 'super_admin');
const isModerator = authorize('admin', 'super_admin', 'moderator');

// Public
router.get('/categories/public', adminController.getPublicCategories);

// Dashboard & Analytics
router.get('/dashboard', authenticate, isModerator, adminController.getDashboard);
router.get('/analytics/growth', authenticate, isAdmin, adminController.getGrowthData);
router.get('/analytics/locations', authenticate, isAdmin, adminController.getLocationStats);
router.get('/analytics/claims', authenticate, isModerator, adminController.getClaimStats);

// Categories
router.get('/categories', authenticate, isModerator, adminController.getCategories);
router.post('/categories', authenticate, isAdmin, adminController.createCategory);
router.put('/categories/:id', authenticate, isAdmin, adminController.updateCategory);
router.delete('/categories/:id', authenticate, isAdmin, adminController.deleteCategory);

// Settings
router.get('/settings', authenticate, isAdmin, adminController.getSettings);
router.put('/settings/:key', authenticate, isAdmin, adminController.updateSetting);

// Audit
router.get('/audit-logs', authenticate, isAdmin, adminController.getAuditLogs);

// Reports
router.get('/reports', authenticate, isModerator, adminController.getReports);
router.put('/reports/:id/resolve', authenticate, isModerator, adminController.resolveReport);

module.exports = router;
