-- =====================================================
-- Smart Restaurant Ordering Web Platform
-- DQL Queries + Views  |  T-SQL (SQL Server)
-- =====================================================

USE Grub;
GO


-- =====================================================
-- SECTION 1: MENU & CATEGORIES (Customer-facing)
-- =====================================================

-- 1.1 All active categories ordered by display priority
SELECT CategoryID, CategoryName, Description, DisplayOrder
FROM   Categories
WHERE  IsActive = 1
ORDER  BY DisplayOrder ASC;
GO

-- 1.2 All available menu items with their category name
SELECT  mi.MenuItemID,
        mi.ItemName,
        mi.Description,
        mi.Price,
        mi.ImageURL,
        c.CategoryName
FROM    MenuItems mi
JOIN    Categories c ON mi.CategoryID = c.CategoryID
WHERE   mi.IsAvailable = 1
  AND   c.IsActive = 1
ORDER   BY c.DisplayOrder, mi.ItemName;
GO

-- 1.3 Menu items filtered by category
SELECT  mi.MenuItemID,
        mi.ItemName,
        mi.Description,
        mi.Price,
        mi.ImageURL
FROM    MenuItems mi
WHERE   mi.CategoryID = @CategoryID   -- parameter: CategoryID
  AND   mi.IsAvailable = 1;
GO

-- 1.4 Search menu items by name (partial match)
SELECT  mi.MenuItemID, mi.ItemName, mi.Description, mi.Price, c.CategoryName
FROM    MenuItems mi
JOIN    Categories c ON mi.CategoryID = c.CategoryID
WHERE   mi.ItemName LIKE '%' + @SearchTerm + '%'  -- parameter: SearchTerm
  AND   mi.IsAvailable = 1;
GO


-- =====================================================
-- SECTION 2: ORDERS (Customer)
-- =====================================================

-- 2.1 Place order: insert Order header (used with app logic)
-- INSERT done via application layer; this is the retrieval query after insert:
SELECT  o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        o.OrderStatus,
        o.PaymentMethod,
        o.DeliveryAddress,
        o.DeliveryCity,
        o.SpecialInstructions
FROM    Orders o
WHERE   o.OrderID = @OrderID;   -- parameter: OrderID
GO

-- 2.2 Full order details with item names (order confirmation / receipt)
SELECT  od.OrderDetailID,
        mi.ItemName,
        od.Quantity,
        od.UnitPrice,
        od.Subtotal,
        od.SpecialRequest
FROM    OrderDetails od
JOIN    MenuItems mi ON od.MenuItemID = mi.MenuItemID
WHERE   od.OrderID = @OrderID;  -- parameter: OrderID
GO

-- 2.3 Customer order history (all orders for a customer)
SELECT  o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        o.OrderStatus,
        o.PaymentMethod,
        o.DeliveryAddress
FROM    Orders o
WHERE   o.CustomerID = @CustomerID  -- parameter: CustomerID
ORDER   BY o.OrderDate DESC;
GO

-- 2.4 Track a specific order status
SELECT  o.OrderID,
        o.OrderStatus,
        o.OrderDate,
        o.TotalAmount,
        u.FullName   AS DeliveryPersonName,
        u.PhoneNumber AS DeliveryPersonPhone
FROM    Orders o
LEFT JOIN Users u ON o.DeliveryPersonID = u.UserID
WHERE   o.OrderID    = @OrderID
  AND   o.CustomerID = @CustomerID;  -- security: confirm ownership
GO


-- =====================================================
-- SECTION 3: ADMIN QUERIES
-- =====================================================

-- 3.1 All orders with customer and delivery person info
SELECT  o.OrderID,
        o.OrderDate,
        o.OrderStatus,
        o.TotalAmount,
        o.PaymentMethod,
        c.FullName   AS CustomerName,
        c.PhoneNumber AS CustomerPhone,
        d.FullName   AS DeliveryPersonName,
        d.PhoneNumber AS DeliveryPersonPhone,
        o.DeliveryAddress,
        o.DeliveryCity
FROM    Orders o
JOIN    Users c ON o.CustomerID = c.UserID
LEFT JOIN Users d ON o.DeliveryPersonID = d.UserID
ORDER   BY o.OrderDate DESC;
GO

-- 3.2 Orders filtered by status
SELECT  o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        c.FullName  AS CustomerName,
        c.PhoneNumber
FROM    Orders o
JOIN    Users c ON o.CustomerID = c.UserID
WHERE   o.OrderStatus = @OrderStatus  -- parameter: e.g. 'Pending'
ORDER   BY o.OrderDate ASC;
GO

-- 3.3 All customers
SELECT  UserID, FullName, PhoneNumber, Email, Address, City, IsActive, CreatedAt
FROM    Users
WHERE   Role = 'Customer'
ORDER   BY CreatedAt DESC;
GO

-- 3.4 All delivery persons with availability
SELECT  UserID, FullName, PhoneNumber, City, VehicleType, VehicleNumber, IsAvailable, IsActive
FROM    Users
WHERE   Role = 'DeliveryPerson'
ORDER   BY FullName;
GO

-- 3.5 Available (unassigned / free) delivery persons
SELECT  UserID, FullName, PhoneNumber, City, VehicleType
FROM    Users
WHERE   Role        = 'DeliveryPerson'
  AND   IsAvailable = 1
  AND   IsActive    = 1;
GO

-- 3.6 Revenue summary by date (daily totals)
SELECT  CAST(OrderDate AS DATE) AS OrderDay,
        COUNT(*)                AS TotalOrders,
        SUM(TotalAmount)        AS TotalRevenue
FROM    Orders
WHERE   OrderStatus = 'Delivered'
GROUP   BY CAST(OrderDate AS DATE)
ORDER   BY OrderDay DESC;
GO

-- 3.7 Top selling menu items
SELECT  TOP 10
        mi.MenuItemID,
        mi.ItemName,
        c.CategoryName,
        SUM(od.Quantity)  AS TotalQuantitySold,
        SUM(od.Subtotal)  AS TotalRevenue
FROM    OrderDetails od
JOIN    MenuItems mi ON od.MenuItemID = mi.MenuItemID
JOIN    Categories c ON mi.CategoryID = c.CategoryID
JOIN    Orders     o  ON od.OrderID   = o.OrderID
WHERE   o.OrderStatus = 'Delivered'
GROUP   BY mi.MenuItemID, mi.ItemName, c.CategoryName
ORDER   BY TotalQuantitySold DESC;
GO

-- 3.8 Revenue by category
SELECT  c.CategoryName,
        COUNT(DISTINCT o.OrderID) AS TotalOrders,
        SUM(od.Subtotal)          AS TotalRevenue
FROM    OrderDetails od
JOIN    MenuItems mi ON od.MenuItemID = mi.MenuItemID
JOIN    Categories c ON mi.CategoryID = c.CategoryID
JOIN    Orders     o ON od.OrderID    = o.OrderID
WHERE   o.OrderStatus = 'Delivered'
GROUP   BY c.CategoryID, c.CategoryName
ORDER   BY TotalRevenue DESC;
GO


-- =====================================================
-- SECTION 4: DELIVERY PERSON QUERIES
-- =====================================================

-- 4.1 Orders assigned to a delivery person
SELECT  o.OrderID,
        o.OrderDate,
        o.OrderStatus,
        o.TotalAmount,
        o.DeliveryAddress,
        o.DeliveryCity,
        o.SpecialInstructions,
        c.FullName    AS CustomerName,
        c.PhoneNumber AS CustomerPhone
FROM    Orders o
JOIN    Users c ON o.CustomerID = c.UserID
WHERE   o.DeliveryPersonID = @DeliveryPersonID  -- parameter
ORDER   BY o.OrderDate DESC;
GO

-- 4.2 Active (in-progress) deliveries for a delivery person
SELECT  o.OrderID,
        o.OrderStatus,
        o.DeliveryAddress,
        o.DeliveryCity,
        c.FullName    AS CustomerName,
        c.PhoneNumber AS CustomerPhone
FROM    Orders o
JOIN    Users c ON o.CustomerID = c.UserID
WHERE   o.DeliveryPersonID = @DeliveryPersonID
  AND   o.OrderStatus IN ('Confirmed', 'Preparing', 'Out for Delivery');
GO

-- 4.3 Completed deliveries for a delivery person
SELECT  o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        c.FullName AS CustomerName
FROM    Orders o
JOIN    Users c ON o.CustomerID = c.UserID
WHERE   o.DeliveryPersonID = @DeliveryPersonID
  AND   o.OrderStatus = 'Delivered'
ORDER   BY o.OrderDate DESC;
GO


-- =====================================================
-- SECTION 5: VIEWS
-- =====================================================

-- View 1: Active menu with category info
CREATE VIEW vw_ActiveMenu AS
SELECT  mi.MenuItemID,
        mi.ItemName,
        mi.Description,
        mi.Price,
        mi.ImageURL,
        c.CategoryID,
        c.CategoryName,
        c.DisplayOrder
FROM    MenuItems mi
JOIN    Categories c ON mi.CategoryID = c.CategoryID
WHERE   mi.IsAvailable = 1
  AND   c.IsActive     = 1;
GO

-- View 2: Full order summary (admin dashboard)
CREATE VIEW vw_OrderSummary AS
SELECT  o.OrderID,
        o.OrderDate,
        o.OrderStatus,
        o.TotalAmount,
        o.PaymentMethod,
        o.DeliveryAddress,
        o.DeliveryCity,
        c.UserID      AS CustomerID,
        c.FullName    AS CustomerName,
        c.PhoneNumber AS CustomerPhone,
        d.UserID      AS DeliveryPersonID,
        d.FullName    AS DeliveryPersonName,
        d.PhoneNumber AS DeliveryPersonPhone
FROM    Orders o
JOIN    Users  c ON o.CustomerID       = c.UserID
LEFT JOIN Users d ON o.DeliveryPersonID = d.UserID;
GO

-- View 3: Order line items with item details
CREATE VIEW vw_OrderItemDetails AS
SELECT  od.OrderDetailID,
        od.OrderID,
        mi.MenuItemID,
        mi.ItemName,
        c.CategoryName,
        od.Quantity,
        od.UnitPrice,
        od.Subtotal,
        od.SpecialRequest
FROM    OrderDetails od
JOIN    MenuItems mi ON od.MenuItemID  = mi.MenuItemID
JOIN    Categories c ON mi.CategoryID = c.CategoryID;
GO

-- View 4: Customer order history
CREATE VIEW vw_CustomerOrders AS
SELECT  u.UserID      AS CustomerID,
        u.FullName    AS CustomerName,
        u.PhoneNumber,
        u.Email,
        o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        o.OrderStatus,
        o.PaymentMethod,
        o.DeliveryAddress
FROM    Users  u
JOIN    Orders o ON u.UserID = o.CustomerID
WHERE   u.Role = 'Customer';
GO

-- View 5: Delivery person workload
CREATE VIEW vw_DeliveryWorkload AS
SELECT  u.UserID          AS DeliveryPersonID,
        u.FullName,
        u.PhoneNumber,
        u.City,
        u.VehicleType,
        u.IsAvailable,
        COUNT(o.OrderID)  AS TotalAssigned,
        SUM(CASE WHEN o.OrderStatus = 'Delivered'        THEN 1 ELSE 0 END) AS Delivered,
        SUM(CASE WHEN o.OrderStatus = 'Out for Delivery' THEN 1 ELSE 0 END) AS InProgress
FROM    Users u
LEFT JOIN Orders o ON u.UserID = o.DeliveryPersonID
WHERE   u.Role = 'DeliveryPerson'
  AND   u.IsActive = 1
GROUP   BY u.UserID, u.FullName, u.PhoneNumber, u.City, u.VehicleType, u.IsAvailable;
GO

-- View 6: Menu item popularity (all-time)
CREATE VIEW vw_MenuItemPopularity AS
SELECT  mi.MenuItemID,
        mi.ItemName,
        c.CategoryName,
        mi.Price,
        mi.IsAvailable,
        ISNULL(SUM(od.Quantity), 0)  AS TotalOrdered,
        ISNULL(SUM(od.Subtotal), 0)  AS TotalRevenue
FROM    MenuItems mi
JOIN    Categories   c  ON mi.CategoryID  = c.CategoryID
LEFT JOIN OrderDetails od ON mi.MenuItemID = od.MenuItemID
LEFT JOIN Orders       o  ON od.OrderID   = o.OrderID
                          AND o.OrderStatus = 'Delivered'
GROUP   BY mi.MenuItemID, mi.ItemName, c.CategoryName, mi.Price, mi.IsAvailable;
GO
