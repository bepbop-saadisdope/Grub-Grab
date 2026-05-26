const { getPool, sql } = require('../../config/db');

async function getCategories(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT CategoryID, CategoryName, Description, DisplayOrder
      FROM   Categories
      WHERE  IsActive = 1
      ORDER  BY DisplayOrder ASC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function getMenuItems(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT  mi.MenuItemID, mi.ItemName, mi.Description, mi.Price,
              mi.ImageURL, mi.IsFeatured, c.CategoryID, c.CategoryName
      FROM    MenuItems mi
      JOIN    Categories c ON mi.CategoryID = c.CategoryID
      WHERE   mi.IsAvailable = 1 AND c.IsActive = 1
      ORDER   BY c.DisplayOrder, mi.ItemName
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function getItemsByCategory(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('CategoryID', sql.Int, parseInt(req.params.categoryId, 10))
      .query(`
        SELECT mi.MenuItemID, mi.ItemName, mi.Description, mi.Price,
               mi.ImageURL
        FROM   MenuItems mi
        WHERE  mi.CategoryID = @CategoryID AND mi.IsAvailable = 1
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function searchItems(req, res) {
  const { q } = req.query;
  if (!q || q.trim() === '') return res.json({ success: true, data: [] });
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('SearchTerm', sql.NVarChar(100), q.trim())
      .query(`
        SELECT mi.MenuItemID, mi.ItemName, mi.Description, mi.Price,
               mi.ImageURL, c.CategoryName
        FROM   MenuItems mi
        JOIN   Categories c ON mi.CategoryID = c.CategoryID
        WHERE  mi.ItemName LIKE '%' + @SearchTerm + '%' AND mi.IsAvailable = 1
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { getCategories, getMenuItems, getItemsByCategory, searchItems };
