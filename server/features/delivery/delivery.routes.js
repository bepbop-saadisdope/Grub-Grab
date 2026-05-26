const router          = require('express').Router();
const rateLimit       = require('express-rate-limit');
const { requireRole } = require('../../middleware/auth');
const ctrl            = require('./delivery.controller');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Try again later.' },
});

// Public
router.post('/login', loginLimiter, ctrl.login);

// All routes below require DeliveryPerson token
router.use(requireRole('DeliveryPerson'));

router.get('/orders/active',              ctrl.getActiveDeliveries);  // before /:orderId
router.get('/orders',                     ctrl.getAssignedOrders);
router.patch('/orders/:orderId/status',   ctrl.updateDeliveryStatus);

module.exports = router;
