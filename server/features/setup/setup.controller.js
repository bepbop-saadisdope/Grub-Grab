const crypto           = require('crypto');
const { getPool, sql } = require('../../config/db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/setup/admin
// Creates the first Admin user. Fails if any Admin already exists.
async function createFirstAdmin(req, res) {
  const { fullName, email, password, phoneNumber } = req.body;

  if (!fullName || !email || !password || !phoneNumber) {
    return res.status(400).json({
      success: false,
      error: 'fullName, email, password, and phoneNumber are required',
    });
  }

  try {
    const pool = await getPool();

    // Block if any privileged account already exists
    const existing = await pool.request().query(
      `SELECT COUNT(*) AS cnt FROM Users WHERE Role IN ('Admin', 'SuperAdmin')`
    );
    if (existing.recordset[0].cnt > 0) {
      return res.status(403).json({
        success: false,
        error: 'Setup already complete. An admin account already exists.',
      });
    }

    const result = await pool.request()
      .input('FullName',     sql.NVarChar(100), fullName)
      .input('Email',        sql.NVarChar(100), email)
      .input('Password',     sql.NVarChar(255), hashPassword(password))
      .input('PhoneNumber',  sql.NVarChar(20),  phoneNumber)
      .query(`
        INSERT INTO Users (FullName, Email, Password, PhoneNumber, Role)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Role
        VALUES (@FullName, @Email, @Password, @PhoneNumber, 'Admin')
      `);

    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { createFirstAdmin };
