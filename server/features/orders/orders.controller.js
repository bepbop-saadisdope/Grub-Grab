const { getPool, sql } = require('../../config/db');

// Find existing customer by phone or create a new one.
// Runs inside the provided transaction to stay atomic.
async function findOrCreateCustomer(transaction, fullName, phoneNumber, address, city) {
  const existing = await new sql.Request(transaction)
    .input('Phone', sql.NVarChar(20), phoneNumber)
    .query(`SELECT UserID FROM Users WHERE PhoneNumber = @Phone AND Role = 'Customer'`);

  if (existing.recordset.length > 0) return existing.recordset[0].UserID;

  const inserted = await new sql.Request(transaction)
    .input('FullName',     sql.NVarChar(100), fullName)
    .input('PhoneNumber',  sql.NVarChar(20),  phoneNumber)
    .input('Address',      sql.NVarChar(500), address || null)
    .input('City',         sql.NVarChar(50),  city    || null)
    .query(`
      INSERT INTO Users (FullName, PhoneNumber, Address, City, Role)
      OUTPUT INSERTED.UserID
      VALUES (@FullName, @PhoneNumber, @Address, @City, 'Customer')
    `);
  return inserted.recordset[0].UserID;
}

async function placeOrder(req, res) {
  const { fullName, phoneNumber, deliveryAddress, deliveryCity,
          specialInstructions, items } = req.body;

  if (!fullName || !phoneNumber || !deliveryAddress ||
      !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'fullName, phoneNumber, deliveryAddress, and items[] are required',
    });
  }

  const pool        = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Find or create customer
    const customerId = await findOrCreateCustomer(
      transaction, fullName, phoneNumber, deliveryAddress, deliveryCity
    );

    // 2. Validate each item price from DB (never trust client-sent price)
    let totalAmount      = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuRow = await new sql.Request(transaction)
        .input('MenuItemID', sql.Int, parseInt(item.menuItemId, 10))
        .query(`SELECT MenuItemID, Price FROM MenuItems WHERE MenuItemID = @MenuItemID AND IsAvailable = 1`);

      if (menuRow.recordset.length === 0) {
        throw new Error(`Menu item ${item.menuItemId} is unavailable or does not exist`);
      }

      const unitPrice = parseFloat(menuRow.recordset[0].Price);
      const quantity  = Math.max(1, parseInt(item.quantity, 10) || 1);
      totalAmount    += unitPrice * quantity;

      validatedItems.push({
        menuItemId:     item.menuItemId,
        quantity,
        unitPrice,
        specialRequest: item.specialRequest || null,
      });
    }

    // 3. Insert Order header
    const orderRow = await new sql.Request(transaction)
      .input('CustomerID',          sql.Int,           customerId)
      .input('TotalAmount',         sql.Decimal(10, 2), totalAmount)
      .input('DeliveryAddress',     sql.NVarChar(500), deliveryAddress)
      .input('DeliveryCity',        sql.NVarChar(50),  deliveryCity        || null)
      .input('SpecialInstructions', sql.NVarChar(500), specialInstructions || null)
      .query(`
        INSERT INTO Orders (CustomerID, TotalAmount, DeliveryAddress, DeliveryCity, SpecialInstructions)
        OUTPUT INSERTED.OrderID
        VALUES (@CustomerID, @TotalAmount, @DeliveryAddress, @DeliveryCity, @SpecialInstructions)
      `);

    const orderId = orderRow.recordset[0].OrderID;

    // 4. Insert OrderDetails (Subtotal is a computed column — do NOT insert it)
    for (const item of validatedItems) {
      await new sql.Request(transaction)
        .input('OrderID',       sql.Int,           orderId)
        .input('MenuItemID',    sql.Int,           item.menuItemId)
        .input('Quantity',      sql.Int,           item.quantity)
        .input('UnitPrice',     sql.Decimal(10, 2), item.unitPrice)
        .input('SpecialRequest', sql.NVarChar(500), item.specialRequest)
        .query(`
          INSERT INTO OrderDetails (OrderID, MenuItemID, Quantity, UnitPrice, SpecialRequest)
          VALUES (@OrderID, @MenuItemID, @Quantity, @UnitPrice, @SpecialRequest)
        `);
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: { orderId, totalAmount: parseFloat(totalAmount.toFixed(2)), orderStatus: 'Pending' },
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function getOrder(req, res) {
  try {
    const pool    = await getPool();
    const orderId = parseInt(req.params.orderId, 10);

    const [orderResult, itemsResult] = await Promise.all([
      pool.request()
        .input('OrderID', sql.Int, orderId)
        .query(`
          SELECT o.OrderID, o.OrderDate, o.TotalAmount, o.OrderStatus,
                 o.PaymentMethod, o.DeliveryAddress, o.DeliveryCity, o.SpecialInstructions,
                 u.FullName    AS DeliveryPersonName,
                 u.PhoneNumber AS DeliveryPersonPhone
          FROM   Orders o
          LEFT JOIN Users u ON o.DeliveryPersonID = u.UserID
          WHERE  o.OrderID = @OrderID
        `),
      pool.request()
        .input('OrderID', sql.Int, orderId)
        .query(`
          SELECT od.OrderDetailID, mi.ItemName, od.Quantity,
                 od.UnitPrice, od.Subtotal, od.SpecialRequest
          FROM   OrderDetails od
          JOIN   MenuItems mi ON od.MenuItemID = mi.MenuItemID
          WHERE  od.OrderID = @OrderID
        `),
    ]);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      data: { ...orderResult.recordset[0], items: itemsResult.recordset },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/orders/history?phone=03001234567
async function getOrderHistory(req, res) {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'phone query parameter is required' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('Phone', sql.NVarChar(20), phone.trim())
      .query(`
        SELECT o.OrderID, o.OrderDate, o.TotalAmount, o.OrderStatus,
               o.PaymentMethod, o.DeliveryAddress, o.DeliveryCity
        FROM   Orders o
        JOIN   Users  u ON o.CustomerID = u.UserID
        WHERE  u.PhoneNumber = @Phone AND u.Role = 'Customer'
        ORDER  BY o.OrderDate DESC
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { placeOrder, getOrder, getOrderHistory };
