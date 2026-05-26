-- =====================================================
-- Smart Restaurant Ordering Web Platform
-- REDESIGNED SCHEMA (Following Instructor Feedback)
-- FAST-NU Lahore | Spring 2026
-- =====================================================


CREATE DATABASE Grub;
GO

USE Grub;
GO

-- =====================================================
-- Table: Users (Unified: Admin + Customer + DeliveryPerson)
-- =====================================================
CREATE TABLE Users (
    UserID        INT           PRIMARY KEY IDENTITY(1,1),
    FullName      NVARCHAR(100) NOT NULL,
    PhoneNumber   NVARCHAR(20)  NOT NULL,
    Email         NVARCHAR(100),
    Password      NVARCHAR(255),                          -- Hashed; required for Admin / SuperAdmin / DeliveryPerson
    Role          NVARCHAR(20)  NOT NULL
                  CONSTRAINT CK_Users_Role
                  CHECK (Role IN ('Admin', 'Customer', 'DeliveryPerson', 'SuperAdmin')),
    Cnic          NVARCHAR(15),                           -- Pakistani CNIC (format XXXXX-XXXXXXX-X) — employees only
    Address       NVARCHAR(500),                          -- Customer / DeliveryPerson
    City          NVARCHAR(50),
    PostalCode    NVARCHAR(10),
    VehicleType   NVARCHAR(50),                           -- DeliveryPerson only
    VehicleNumber NVARCHAR(20),                           -- DeliveryPerson only
    IsAvailable   BIT           DEFAULT 1,                -- DeliveryPerson only
    IsActive      BIT           DEFAULT 1,
    CreatedAt     DATETIME      DEFAULT GETDATE()
);
GO

-- =====================================================
-- Table: Categories
-- =====================================================
CREATE TABLE Categories (
    CategoryID   INT           PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(50)  NOT NULL UNIQUE,
    Description  NVARCHAR(500),
    DisplayOrder INT           DEFAULT 0,
    IsActive     BIT           DEFAULT 1
);
GO

-- =====================================================
-- Table: MenuItems
-- =====================================================
CREATE TABLE MenuItems (
    MenuItemID      INT            PRIMARY KEY IDENTITY(1,1),
    CategoryID      INT            NOT NULL,
    ItemName        NVARCHAR(100)  NOT NULL,
    Description     NVARCHAR(500),
    Price           DECIMAL(10,2)  NOT NULL,
    ImageURL        NVARCHAR(255),
    IsAvailable     BIT            DEFAULT 1,
    IsFeatured      BIT            NOT NULL DEFAULT 0,    -- pinned to "New Arrivals" on the homepage
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);
GO

-- =====================================================
-- Table: Orders
-- =====================================================
CREATE TABLE Orders (
    OrderID              INT            PRIMARY KEY IDENTITY(1,1),
    CustomerID           INT            NOT NULL,         -- Users.Role = 'Customer'
    DeliveryPersonID     INT,                             -- Users.Role = 'DeliveryPerson'
    OrderDate            DATETIME       DEFAULT GETDATE(),
    TotalAmount          DECIMAL(10,2)  NOT NULL,
    OrderStatus          NVARCHAR(20)   DEFAULT 'Pending'
                         CHECK (OrderStatus IN ('Pending','Confirmed','Preparing',
                                                'Out for Delivery','Delivered','Cancelled')),
    PaymentMethod        NVARCHAR(20)   DEFAULT 'Cash on Delivery'
                         CHECK (PaymentMethod IN ('Cash on Delivery','Credit Card',
                                                  'Debit Card','Online')),
    DeliveryAddress      NVARCHAR(500)  NOT NULL,
    DeliveryCity         NVARCHAR(50),
    SpecialInstructions  NVARCHAR(500),
    FOREIGN KEY (CustomerID)       REFERENCES Users(UserID),
    FOREIGN KEY (DeliveryPersonID) REFERENCES Users(UserID)
);
GO

-- =====================================================
-- Table: OrderDetails
-- =====================================================
CREATE TABLE OrderDetails (
    OrderDetailID  INT            PRIMARY KEY IDENTITY(1,1),
    OrderID        INT            NOT NULL,
    MenuItemID     INT            NOT NULL,
    Quantity       INT            NOT NULL DEFAULT 1,
    UnitPrice      DECIMAL(10,2)  NOT NULL,
    Subtotal       AS (Quantity * UnitPrice) PERSISTED,  -- computed, always consistent
    SpecialRequest NVARCHAR(500),
    FOREIGN KEY (OrderID)    REFERENCES Orders(OrderID),
    FOREIGN KEY (MenuItemID) REFERENCES MenuItems(MenuItemID)
);
GO

-- =====================================================
-- Table: RemovalRequests (Admin proposes; SuperAdmin approves/denies)
-- =====================================================
CREATE TABLE RemovalRequests (
    RequestID         INT           PRIMARY KEY IDENTITY(1,1),
    RequestedByUserID INT           NOT NULL,
    TargetUserID      INT           NOT NULL,
    Reason            NVARCHAR(500) NOT NULL,
    Status            NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                      CONSTRAINT CK_RemovalRequests_Status
                      CHECK (Status IN ('Pending', 'Approved', 'Denied')),
    CreatedAt         DATETIME      DEFAULT GETDATE(),
    ResolvedByUserID  INT,
    ResolvedAt        DATETIME,
    ResolutionNote    NVARCHAR(500),
    FOREIGN KEY (RequestedByUserID) REFERENCES Users(UserID),
    FOREIGN KEY (TargetUserID)      REFERENCES Users(UserID),
    FOREIGN KEY (ResolvedByUserID)  REFERENCES Users(UserID)
);
GO

-- =====================================================
-- Indexes (performance on FK columns)
-- =====================================================
CREATE INDEX IX_MenuItems_CategoryID       ON MenuItems   (CategoryID);
CREATE INDEX IX_Orders_CustomerID          ON Orders      (CustomerID);
CREATE INDEX IX_Orders_DeliveryPersonID    ON Orders      (DeliveryPersonID);
CREATE INDEX IX_Orders_OrderStatus         ON Orders      (OrderStatus);
CREATE INDEX IX_OrderDetails_OrderID       ON OrderDetails(OrderID);
CREATE INDEX IX_OrderDetails_MenuItemID    ON OrderDetails(MenuItemID);
CREATE INDEX IX_RemovalRequests_Status     ON RemovalRequests(Status);
CREATE INDEX IX_RemovalRequests_TargetUser ON RemovalRequests(TargetUserID);
GO
