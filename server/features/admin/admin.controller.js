const crypto   = require('crypto');
const { getPool, sql } = require('../../config/db');
const { signToken }    = require('../../middleware/auth');

const VALID_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/admin/login
// Accepts both Admin and SuperAdmin. Returned role drives client-side tab visibility.
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email and password are required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('Email',    sql.NVarChar(100), email)
      .input('Password', sql.NVarChar(255), hashPassword(password))
      .query(`
        SELECT UserID, FullName, Email, Role
        FROM   Users
        WHERE  Email = @Email AND Password = @Password
          AND  Role IN ('Admin', 'SuperAdmin') AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user  = result.recordset[0];
    const token = signToken(user.UserID, user.Role);
    res.json({
      success: true,
      data: {
        token,
        user: {
          userId:   user.UserID,
          fullName: user.FullName,
          email:    user.Email,
          role:     user.Role,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/admin/orders?status=Pending
async function getAllOrders(req, res) {
  try {
    const pool    = await getPool();
    const request = pool.request();
    let query = `
      SELECT  o.OrderID, o.OrderDate, o.OrderStatus, o.TotalAmount, o.PaymentMethod,
              c.FullName    AS CustomerName,       c.PhoneNumber AS CustomerPhone,
              d.FullName    AS DeliveryPersonName, d.PhoneNumber AS DeliveryPersonPhone,
              o.DeliveryAddress, o.DeliveryCity
      FROM    Orders o
      JOIN    Users c    ON o.CustomerID       = c.UserID
      LEFT JOIN Users d  ON o.DeliveryPersonID = d.UserID
    `;
    if (req.query.status) {
      request.input('Status', sql.NVarChar(20), req.query.status);
      query += ' WHERE o.OrderStatus = @Status';
    }
    query += ' ORDER BY o.OrderDate DESC';

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/admin/orders/:orderId/status
async function updateOrderStatus(req, res) {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('OrderID', sql.Int,        parseInt(req.params.orderId, 10))
      .input('Status',  sql.NVarChar(20), status)
      .query(`UPDATE Orders SET OrderStatus = @Status WHERE OrderID = @OrderID`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: { orderId: parseInt(req.params.orderId, 10), status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/admin/orders/:orderId/assign
async function assignDeliveryPerson(req, res) {
  const { deliveryPersonId } = req.body;
  if (!deliveryPersonId) {
    return res.status(400).json({ success: false, error: 'deliveryPersonId is required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('OrderID',          sql.Int, parseInt(req.params.orderId, 10))
      .input('DeliveryPersonID', sql.Int, parseInt(deliveryPersonId, 10))
      .query(`UPDATE Orders SET DeliveryPersonID = @DeliveryPersonID WHERE OrderID = @OrderID`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: { orderId: parseInt(req.params.orderId, 10), deliveryPersonId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/admin/menu
async function getAllMenuItems(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT mi.MenuItemID, mi.ItemName, mi.Description, mi.Price,
             mi.ImageURL, mi.IsAvailable, mi.IsFeatured,
             c.CategoryID, c.CategoryName
      FROM   MenuItems mi
      JOIN   Categories c ON mi.CategoryID = c.CategoryID
      ORDER  BY c.DisplayOrder, mi.ItemName
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// POST /api/admin/menu
async function addMenuItem(req, res) {
  const { categoryId, itemName, description, price, imageURL } = req.body;
  if (!categoryId || !itemName || price === undefined) {
    return res.status(400).json({ success: false, error: 'categoryId, itemName, and price are required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('CategoryID',  sql.Int,           parseInt(categoryId, 10))
      .input('ItemName',    sql.NVarChar(100),  itemName)
      .input('Description', sql.NVarChar(500),  description || null)
      .input('Price',       sql.Decimal(10, 2), parseFloat(price))
      .input('ImageURL',    sql.NVarChar(255),  imageURL    || null)
      .query(`
        INSERT INTO MenuItems (CategoryID, ItemName, Description, Price, ImageURL)
        OUTPUT INSERTED.MenuItemID, INSERTED.ItemName, INSERTED.Price, INSERTED.IsAvailable
        VALUES (@CategoryID, @ItemName, @Description, @Price, @ImageURL)
      `);
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/admin/menu/:itemId/featured   (SuperAdmin only)
async function setMenuItemFeatured(req, res) {
  const { isFeatured } = req.body;
  if (typeof isFeatured !== 'boolean') {
    return res.status(400).json({ success: false, error: 'isFeatured (true/false) is required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('MenuItemID', sql.Int, parseInt(req.params.itemId, 10))
      .input('IsFeatured', sql.Bit, isFeatured ? 1 : 0)
      .query(`UPDATE MenuItems SET IsFeatured = @IsFeatured WHERE MenuItemID = @MenuItemID`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }
    res.json({
      success: true,
      data: { menuItemId: parseInt(req.params.itemId, 10), isFeatured },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PUT /api/admin/menu/:itemId
async function updateMenuItem(req, res) {
  const { itemName, description, price, imageURL, isAvailable, categoryId } = req.body;
  if (!itemName || price === undefined || !categoryId) {
    return res.status(400).json({ success: false, error: 'itemName, price, and categoryId are required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('MenuItemID',  sql.Int,           parseInt(req.params.itemId, 10))
      .input('CategoryID',  sql.Int,           parseInt(categoryId, 10))
      .input('ItemName',    sql.NVarChar(100),  itemName)
      .input('Description', sql.NVarChar(500),  description || null)
      .input('Price',       sql.Decimal(10, 2), parseFloat(price))
      .input('ImageURL',    sql.NVarChar(255),  imageURL    || null)
      .input('IsAvailable', sql.Bit,            isAvailable !== undefined ? (isAvailable ? 1 : 0) : 1)
      .query(`
        UPDATE MenuItems
        SET    CategoryID = @CategoryID, ItemName = @ItemName, Description = @Description,
               Price = @Price, ImageURL = @ImageURL, IsAvailable = @IsAvailable
        WHERE  MenuItemID = @MenuItemID
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }
    res.json({ success: true, data: { menuItemId: parseInt(req.params.itemId, 10) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// DELETE /api/admin/menu/:itemId  (soft delete — preserves order history)
async function deleteMenuItem(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('MenuItemID', sql.Int, parseInt(req.params.itemId, 10))
      .query(`UPDATE MenuItems SET IsAvailable = 0 WHERE MenuItemID = @MenuItemID`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }
    res.json({ success: true, data: { menuItemId: parseInt(req.params.itemId, 10), isAvailable: false } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/admin/delivery-persons
async function getDeliveryPersons(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT UserID, FullName, PhoneNumber, City, VehicleType, VehicleNumber, IsAvailable, IsActive
      FROM   Users
      WHERE  Role = 'DeliveryPerson'
      ORDER  BY FullName
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/admin/stats
async function getStats(req, res) {
  try {
    const pool = await getPool();
    const [revenue, topItems, statusCounts] = await Promise.all([
      pool.request().query(`
        SELECT TOP 30
               CAST(OrderDate AS DATE) AS OrderDay,
               COUNT(*)                AS TotalOrders,
               SUM(TotalAmount)        AS TotalRevenue
        FROM   Orders
        WHERE  OrderStatus = 'Delivered'
        GROUP  BY CAST(OrderDate AS DATE)
        ORDER  BY OrderDay DESC
      `),
      pool.request().query(`
        SELECT TOP 5
               mi.ItemName,
               SUM(od.Quantity) AS TotalSold
        FROM   OrderDetails od
        JOIN   MenuItems mi ON od.MenuItemID = mi.MenuItemID
        JOIN   Orders    o  ON od.OrderID    = o.OrderID
        WHERE  o.OrderStatus = 'Delivered'
        GROUP  BY mi.MenuItemID, mi.ItemName
        ORDER  BY TotalSold DESC
      `),
      pool.request().query(`
        SELECT OrderStatus, COUNT(*) AS Count
        FROM   Orders
        GROUP  BY OrderStatus
      `),
    ]);
    res.json({
      success: true,
      data: {
        revenueByDay:  revenue.recordset,
        topItems:      topItems.recordset,
        statusCounts:  statusCounts.recordset,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

// GET /api/admin/categories
async function getCategories(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT CategoryID, CategoryName, Description, DisplayOrder, IsActive
      FROM   Categories
      ORDER  BY DisplayOrder ASC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// POST /api/admin/categories
async function addCategory(req, res) {
  const { categoryName, description, displayOrder } = req.body;
  if (!categoryName) {
    return res.status(400).json({ success: false, error: 'categoryName is required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('CategoryName', sql.NVarChar(50),  categoryName)
      .input('Description',  sql.NVarChar(500), description  || null)
      .input('DisplayOrder', sql.Int,           displayOrder || 0)
      .query(`
        INSERT INTO Categories (CategoryName, Description, DisplayOrder)
        OUTPUT INSERTED.*
        VALUES (@CategoryName, @Description, @DisplayOrder)
      `);
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PUT /api/admin/categories/:categoryId
async function updateCategory(req, res) {
  const { categoryName, description, displayOrder, isActive } = req.body;
  if (!categoryName) {
    return res.status(400).json({ success: false, error: 'categoryName is required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('CategoryID',   sql.Int,           parseInt(req.params.categoryId, 10))
      .input('CategoryName', sql.NVarChar(50),  categoryName)
      .input('Description',  sql.NVarChar(500), description  || null)
      .input('DisplayOrder', sql.Int,           displayOrder || 0)
      .input('IsActive',     sql.Bit,           isActive !== undefined ? (isActive ? 1 : 0) : 1)
      .query(`
        UPDATE Categories
        SET    CategoryName = @CategoryName, Description = @Description,
               DisplayOrder = @DisplayOrder, IsActive = @IsActive
        WHERE  CategoryID = @CategoryID
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: { categoryId: parseInt(req.params.categoryId, 10) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// DELETE /api/admin/categories/:categoryId  (soft delete)
async function deleteCategory(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('CategoryID', sql.Int, parseInt(req.params.categoryId, 10))
      .query(`UPDATE Categories SET IsActive = 0 WHERE CategoryID = @CategoryID`);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: { categoryId: parseInt(req.params.categoryId, 10), isActive: false } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// ─── SINGLE ORDER DETAIL ────────────────────────────────────────────────────

// GET /api/admin/orders/:orderId
async function getOrderDetail(req, res) {
  try {
    const pool    = await getPool();
    const orderId = parseInt(req.params.orderId, 10);

    const [orderResult, itemsResult] = await Promise.all([
      pool.request()
        .input('OrderID', sql.Int, orderId)
        .query(`
          SELECT o.OrderID, o.OrderDate, o.OrderStatus, o.TotalAmount, o.PaymentMethod,
                 o.DeliveryAddress, o.DeliveryCity, o.SpecialInstructions,
                 c.UserID      AS CustomerID,   c.FullName    AS CustomerName,
                 c.PhoneNumber AS CustomerPhone,
                 d.UserID      AS DeliveryPersonID, d.FullName AS DeliveryPersonName,
                 d.PhoneNumber AS DeliveryPersonPhone
          FROM   Orders o
          JOIN   Users c    ON o.CustomerID       = c.UserID
          LEFT JOIN Users d ON o.DeliveryPersonID = d.UserID
          WHERE  o.OrderID = @OrderID
        `),
      pool.request()
        .input('OrderID', sql.Int, orderId)
        .query(`
          SELECT od.OrderDetailID, mi.MenuItemID, mi.ItemName,
                 od.Quantity, od.UnitPrice, od.Subtotal, od.SpecialRequest
          FROM   OrderDetails od
          JOIN   MenuItems mi ON od.MenuItemID = mi.MenuItemID
          WHERE  od.OrderID = @OrderID
        `),
    ]);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: { ...orderResult.recordset[0], items: itemsResult.recordset } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// ─── USER MANAGEMENT ────────────────────────────────────────────────────────

// POST /api/admin/users/delivery-person
async function createDeliveryPerson(req, res) {
  const { fullName, phoneNumber, password, cnic, address, city, vehicleType, vehicleNumber } = req.body;
  if (!fullName || !phoneNumber || !password) {
    return res.status(400).json({ success: false, error: 'fullName, phoneNumber, and password are required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('FullName',      sql.NVarChar(100), fullName)
      .input('PhoneNumber',   sql.NVarChar(20),  phoneNumber)
      .input('Password',      sql.NVarChar(255), hashPassword(password))
      .input('Cnic',          sql.NVarChar(15),  cnic          || null)
      .input('Address',       sql.NVarChar(500), address       || null)
      .input('City',          sql.NVarChar(50),  city          || null)
      .input('VehicleType',   sql.NVarChar(50),  vehicleType   || null)
      .input('VehicleNumber', sql.NVarChar(20),  vehicleNumber || null)
      .query(`
        INSERT INTO Users (FullName, PhoneNumber, Password, Cnic, Address, City, VehicleType, VehicleNumber, Role)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.PhoneNumber, INSERTED.Cnic,
               INSERTED.VehicleType, INSERTED.VehicleNumber, INSERTED.IsAvailable, INSERTED.Role
        VALUES (@FullName, @PhoneNumber, @Password, @Cnic, @Address, @City, @VehicleType, @VehicleNumber, 'DeliveryPerson')
      `);
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// POST /api/admin/users/admin   (SuperAdmin only)
async function createAdmin(req, res) {
  const { fullName, email, password, phoneNumber, cnic } = req.body;
  if (!fullName || !email || !password || !phoneNumber) {
    return res.status(400).json({
      success: false,
      error: 'fullName, email, password, and phoneNumber are required',
    });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('FullName',    sql.NVarChar(100), fullName)
      .input('Email',       sql.NVarChar(100), email)
      .input('Password',    sql.NVarChar(255), hashPassword(password))
      .input('PhoneNumber', sql.NVarChar(20),  phoneNumber)
      .input('Cnic',        sql.NVarChar(15),  cnic || null)
      .query(`
        INSERT INTO Users (FullName, Email, Password, PhoneNumber, Cnic, Role)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.PhoneNumber,
               INSERTED.Cnic, INSERTED.Role, INSERTED.IsActive
        VALUES (@FullName, @Email, @Password, @PhoneNumber, @Cnic, 'Admin')
      `);
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/admin/admins   (SuperAdmin only)
async function getAdmins(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT UserID, FullName, Email, PhoneNumber, Cnic, IsActive, CreatedAt
      FROM   Users
      WHERE  Role = 'Admin'
      ORDER  BY CreatedAt DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// ─── REMOVAL REQUESTS ───────────────────────────────────────────────────────

// POST /api/admin/removal-requests
// Body: { targetUserId, reason }
// Any authenticated admin can file. Disallows self-request and duplicates.
async function createRemovalRequest(req, res) {
  const targetUserId = parseInt(req.body.targetUserId, 10);
  const reason = (req.body.reason || '').trim();

  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ success: false, error: 'targetUserId is required' });
  }
  if (!reason || reason.length < 5 || reason.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'reason must be 5–500 characters',
    });
  }
  if (targetUserId === req.user.userId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot file a removal request against yourself',
    });
  }

  try {
    const pool = await getPool();

    // Block duplicate pending requests for the same target.
    const dup = await pool.request()
      .input('TargetUserID', sql.Int, targetUserId)
      .query(`
        SELECT TOP 1 RequestID FROM RemovalRequests
        WHERE TargetUserID = @TargetUserID AND Status = 'Pending'
      `);
    if (dup.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'A pending removal request already exists for this user',
      });
    }

    const result = await pool.request()
      .input('RequestedByUserID', sql.Int,           req.user.userId)
      .input('TargetUserID',      sql.Int,           targetUserId)
      .input('Reason',            sql.NVarChar(500), reason)
      .query(`
        INSERT INTO RemovalRequests (RequestedByUserID, TargetUserID, Reason)
        OUTPUT INSERTED.RequestID, INSERTED.RequestedByUserID, INSERTED.TargetUserID,
               INSERTED.Reason, INSERTED.Status, INSERTED.CreatedAt
        VALUES (@RequestedByUserID, @TargetUserID, @Reason)
      `);
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/admin/removal-requests?status=Pending   (SuperAdmin only)
async function listRemovalRequests(req, res) {
  const status = req.query.status;
  try {
    const pool    = await getPool();
    const request = pool.request();
    let where = '';
    if (status && ['Pending', 'Approved', 'Denied'].includes(status)) {
      request.input('Status', sql.NVarChar(20), status);
      where = 'WHERE r.Status = @Status';
    }
    const result = await request.query(`
      SELECT  r.RequestID, r.Status, r.Reason, r.CreatedAt,
              r.ResolvedByUserID, r.ResolvedAt, r.ResolutionNote,
              r.TargetUserID,    t.FullName AS TargetName,
              t.Role AS TargetRole, t.PhoneNumber AS TargetPhone, t.Email AS TargetEmail,
              r.RequestedByUserID, q.FullName AS RequestedByName
      FROM    RemovalRequests r
      JOIN    Users t ON r.TargetUserID = t.UserID
      JOIN    Users q ON r.RequestedByUserID = q.UserID
      ${where}
      ORDER   BY r.CreatedAt DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/admin/removal-requests/:id/approve   (SuperAdmin only)
// Atomic: marks request Approved AND deactivates the target user.
async function approveRemovalRequest(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const note      = (req.body.note || '').trim().slice(0, 500) || null;
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid request id' });
  }

  const pool = await getPool();
  const tx   = new sql.Transaction(pool);
  try {
    await tx.begin();

    const lookup = await tx.request()
      .input('RequestID', sql.Int, requestId)
      .query(`
        SELECT RequestID, TargetUserID, Status FROM RemovalRequests
        WHERE  RequestID = @RequestID
      `);
    if (lookup.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ success: false, error: 'Removal request not found' });
    }
    const row = lookup.recordset[0];
    if (row.Status !== 'Pending') {
      await tx.rollback();
      return res.status(409).json({
        success: false,
        error: `Request is already ${row.Status}`,
      });
    }

    await tx.request()
      .input('RequestID',         sql.Int,           requestId)
      .input('ResolvedByUserID',  sql.Int,           req.user.userId)
      .input('ResolutionNote',    sql.NVarChar(500), note)
      .query(`
        UPDATE RemovalRequests
        SET    Status = 'Approved',
               ResolvedByUserID = @ResolvedByUserID,
               ResolvedAt = GETDATE(),
               ResolutionNote = @ResolutionNote
        WHERE  RequestID = @RequestID
      `);

    await tx.request()
      .input('UserID', sql.Int, row.TargetUserID)
      .query(`UPDATE Users SET IsActive = 0 WHERE UserID = @UserID`);

    await tx.commit();
    res.json({
      success: true,
      data: { requestId, status: 'Approved', targetUserId: row.TargetUserID },
    });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/admin/removal-requests/:id/deny   (SuperAdmin only)
async function denyRemovalRequest(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const note      = (req.body.note || '').trim().slice(0, 500) || null;
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid request id' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('RequestID',        sql.Int,           requestId)
      .input('ResolvedByUserID', sql.Int,           req.user.userId)
      .input('ResolutionNote',   sql.NVarChar(500), note)
      .query(`
        UPDATE RemovalRequests
        SET    Status = 'Denied',
               ResolvedByUserID = @ResolvedByUserID,
               ResolvedAt = GETDATE(),
               ResolutionNote = @ResolutionNote
        WHERE  RequestID = @RequestID AND Status = 'Pending'
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(409).json({
        success: false,
        error: 'Request not found or already resolved',
      });
    }
    res.json({ success: true, data: { requestId, status: 'Denied' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/admin/users/:userId/status  — activate or deactivate any user
async function toggleUserStatus(req, res) {
  const { isActive } = req.body;
  if (isActive === undefined) {
    return res.status(400).json({ success: false, error: 'isActive (true/false) is required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('UserID',   sql.Int, parseInt(req.params.userId, 10))
      .input('IsActive', sql.Bit, isActive ? 1 : 0)
      .query(`UPDATE Users SET IsActive = @IsActive WHERE UserID = @UserID`);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: { userId: parseInt(req.params.userId, 10), isActive: !!isActive } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = {
  login, getAllOrders, getOrderDetail, updateOrderStatus, assignDeliveryPerson,
  getAllMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, setMenuItemFeatured,
  getCategories, addCategory, updateCategory, deleteCategory,
  getDeliveryPersons, createDeliveryPerson, toggleUserStatus,
  createAdmin, getAdmins,
  createRemovalRequest, listRemovalRequests, approveRemovalRequest, denyRemovalRequest,
  getStats,
};
