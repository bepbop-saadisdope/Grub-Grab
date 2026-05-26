const router     = require('express').Router();
const rateLimit  = require('express-rate-limit');
const { placeOrder, getOrder, getOrderHistory } = require('./orders.controller');

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

router.post('/',           orderLimiter, placeOrder);
router.get('/history',     orderLimiter,getOrderHistory);    // must be before /:orderId
router.get('/:orderId',    orderLimiter,getOrder);

module.exports = router;
