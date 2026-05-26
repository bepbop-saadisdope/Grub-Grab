const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { createFirstAdmin } = require('./setup.controller');

const setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

// One-time setup — blocked after first admin exists
router.post('/admin', setupLimiter, createFirstAdmin);

module.exports = router;