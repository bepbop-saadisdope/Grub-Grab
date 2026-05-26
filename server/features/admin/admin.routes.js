const router          = require('express').Router();
const rateLimit       = require('express-rate-limit');
const { requireRole } = require('../../middleware/auth');
const ctrl            = require('./admin.controller');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Try again later.' },
});

// Public
router.post('/login', loginLimiter, ctrl.login);

// All routes below require Admin OR SuperAdmin token.
// Routes that further require SuperAdmin are gated inline.
router.use(requireRole(['Admin', 'SuperAdmin']));

// SuperAdmin-only gate
const requireSuperAdmin = (req, res, next) =>
  req.user.role === 'SuperAdmin'
    ? next()
    : res.status(403).json({ success: false, error: 'SuperAdmin role required' });

// Orders
router.get('/orders',                     ctrl.getAllOrders);
router.get('/orders/:orderId',            ctrl.getOrderDetail);
router.patch('/orders/:orderId/status',   ctrl.updateOrderStatus);
router.patch('/orders/:orderId/assign',   ctrl.assignDeliveryPerson);

// Menu items
router.get('/menu',                       ctrl.getAllMenuItems);
router.post('/menu',                      ctrl.addMenuItem);
router.put('/menu/:itemId',               ctrl.updateMenuItem);
router.delete('/menu/:itemId',            ctrl.deleteMenuItem);
router.patch('/menu/:itemId/featured',    requireSuperAdmin, ctrl.setMenuItemFeatured);

// Categories
router.get('/categories',                   ctrl.getCategories);
router.post('/categories',                  ctrl.addCategory);
router.put('/categories/:categoryId',       ctrl.updateCategory);
router.delete('/categories/:categoryId',    ctrl.deleteCategory);

// Users / delivery persons
router.get('/delivery-persons',             ctrl.getDeliveryPersons);
router.post('/users/delivery-person',       ctrl.createDeliveryPerson);
router.patch('/users/:userId/status',       ctrl.toggleUserStatus);

// Admin management — SuperAdmin only
router.get('/admins',           requireSuperAdmin, ctrl.getAdmins);
router.post('/users/admin',     requireSuperAdmin, ctrl.createAdmin);

// Removal-request approval workflow
router.post('/removal-requests',                                ctrl.createRemovalRequest);
router.get('/removal-requests',          requireSuperAdmin,     ctrl.listRemovalRequests);
router.patch('/removal-requests/:id/approve', requireSuperAdmin, ctrl.approveRemovalRequest);
router.patch('/removal-requests/:id/deny',    requireSuperAdmin, ctrl.denyRemovalRequest);

// Stats
router.get('/stats', ctrl.getStats);

module.exports = router;
