const crypto           = require('crypto');
const { getPool, sql } = require('../../config/db');
const { signToken }    = require('../../middleware/auth');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/delivery/login
async function login(req, res) {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber || !password) {
    return res.status(400).json({ success: false, error: 'phoneNumber and password are required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('PhoneNumber', sql.NVarChar(20),  phoneNumber)
      .input('Password',    sql.NVarChar(255), hashPassword(password))
      .query(`
        SELECT UserID, FullName, PhoneNumber
        FROM   Users
        WHERE  PhoneNumber = @PhoneNumber AND Password = @Password
          AND  Role = 'DeliveryPerson' AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user  = result.recordset[0];
    const token = signToken(user.UserID, 'DeliveryPerson');
    res.json({
      success: true,
      data: { token, user: { userId: user.UserID, fullName: user.FullName, phoneNumber: user.PhoneNumber } },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/delivery/orders
async function getAssignedOrders(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('DeliveryPersonID', sql.Int, req.user.userId)
      .query(`
        SELECT o.OrderID, o.OrderDate, o.OrderStatus, o.TotalAmount,
               o.DeliveryAddress, o.DeliveryCity, o.SpecialInstructions,
               c.FullName    AS CustomerName,
               c.PhoneNumber AS CustomerPhone
        FROM   Orders o
        JOIN   Users c ON o.CustomerID = c.UserID
        WHERE  o.DeliveryPersonID = @DeliveryPersonID
        ORDER  BY o.OrderDate DESC
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/delivery/orders/active
async function getActiveDeliveries(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('DeliveryPersonID', sql.Int, req.user.userId)
      .query(`
        SELECT o.OrderID, o.OrderStatus, o.DeliveryAddress, o.DeliveryCity,
               o.SpecialInstructions,
               c.FullName    AS CustomerName,
               c.PhoneNumber AS CustomerPhone
        FROM   Orders o
        JOIN   Users c ON o.CustomerID = c.UserID
        WHERE  o.DeliveryPersonID = @DeliveryPersonID
          AND  o.OrderStatus IN ('Confirmed', 'Preparing', 'Out for Delivery')
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/delivery/orders/:orderId/status
// Delivery person can only move to 'Out for Delivery' or 'Delivered'
async function updateDeliveryStatus(req, res) {
  const { status } = req.body;
  const allowed    = ['Out for Delivery', 'Delivered'];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Delivery person can only set status to: ${allowed.join(', ')}`,
    });
  }

  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('OrderID',          sql.Int,          parseInt(req.params.orderId, 10))
      .input('DeliveryPersonID', sql.Int,          req.user.userId)
      .input('Status',           sql.NVarChar(20), status)
      .query(`
        UPDATE Orders
        SET    OrderStatus = @Status
        WHERE  OrderID = @OrderID AND DeliveryPersonID = @DeliveryPersonID
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Order not found or not assigned to you' });
    }

    // If all orders are delivered, mark this delivery person as available again
    if (status === 'Delivered') {
      await pool.request()
        .input('DeliveryPersonID', sql.Int, req.user.userId)
        .query(`
          UPDATE Users
          SET    IsAvailable = CASE
            WHEN (SELECT COUNT(*) FROM Orders
                  WHERE DeliveryPersonID = @DeliveryPersonID
                    AND OrderStatus = 'Out for Delivery') = 0 THEN 1
            ELSE 0
          END
          WHERE UserID = @DeliveryPersonID
        `);
    }

    res.json({ success: true, data: { orderId: parseInt(req.params.orderId, 10), status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { login, getAssignedOrders, getActiveDeliveries, updateDeliveryStatus };
