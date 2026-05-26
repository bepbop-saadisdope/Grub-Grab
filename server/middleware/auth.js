const crypto = require('crypto');

// Token format: "userId:role.HMAC"
// Uses Node's built-in crypto — no extra packages needed.

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in .env — server cannot start without it');
}
const SECRET = process.env.JWT_SECRET;

function signToken(userId, role) {
  const payload  = `${userId}:${role}`;
  const hmac     = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

function decodeToken(token, allowedRoles) {
  if (!token) return null;
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload  = token.slice(0, lastDot);
  const hmac     = token.slice(lastDot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

  if (hmac !== expected) return null;

  const [userId, role] = payload.split(':');
  if (!allowedRoles.includes(role)) return null;

  return { userId: parseInt(userId, 10), role };
}

// Accepts either a single role string or an array of roles.
function requireRole(roleOrRoles) {
  const allowedRoles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const decoded = decodeToken(authHeader.slice(7), allowedRoles);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  };
}

module.exports = { signToken, requireRole };
