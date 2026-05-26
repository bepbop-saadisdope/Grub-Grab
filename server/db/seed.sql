-- =====================================================
-- Grub-Grab Seed Data  (based on real Grub menu)
-- Run this AFTER schema.sql in SSMS
-- =====================================================

USE Grub;
GO

-- ─── Categories ───────────────────────────────────────────────────────────────
INSERT INTO Categories (CategoryName, Description, DisplayOrder) VALUES
('Beef Burgers',   'Smashed beef patty burgers — single or double',        1),
('Chicken Burgers','Crispy & grilled chicken burgers',                      2),
('Wraps',          'Loaded wraps with your choice of filling',              3),
('Sandwiches',     'Grilled chicken and beef steak sandwiches',             4),
('Fries',          'Regular, loaded and specialty fries',                   5),
('Wings',          'Bone-in wings in 7 flavours — 5 or 10 pcs',            6),
('Tenders',        'Crispy chicken tenders in 7 flavours — 3 or 5 pcs',    7),
('Sides & Extras', 'Sliders, onion rings, cheese sticks and fish items',   8);
GO

-- ─── Beef Burgers (CategoryID = 1) ────────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(1, 'Mushroom Melt',         'Smashed beef patty with sautéed mushrooms and melted cheese',             600.00),
(1, 'Jalapeno Popper',       'Smashed beef patty loaded with jalapeños and cream cheese',               600.00),
(1, 'French Onion',          'Smashed beef patty with caramelised onions and Swiss cheese',             600.00),
(1, 'Cheddar Blast',         'Double smashed beef patty smothered in cheddar sauce',                    800.00),
(1, 'Deluxe Double Cheese',  'Double smashed beef patty with double cheese and special sauce',          600.00),
(1, 'BBQ Beef Smash',        'Smashed beef patty with smoky BBQ sauce and crispy onions',               600.00),
(1, 'Bacon Jam Beef Smash',  'Smashed beef patty with house-made bacon jam and pickles',                700.00);
GO

-- ─── Chicken Burgers (CategoryID = 2) ─────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(2, 'Fire Crunch Injected',        'Juicy injected crispy chicken fillet with fire sauce',              580.00),
(2, 'Mighty Fire Crunch Injected', 'XL injected crispy chicken fillet with extra fire sauce',           830.00),
(2, 'Crispy Clucker',              'Classic crispy chicken fillet with coleslaw and mayo',              450.00),
(2, 'Mighty Crispy Clucker',       'XL crispy chicken fillet with double coleslaw and mayo',            700.00),
(2, 'Hot Lava Mess',               'Crispy chicken drenched in hot lava sauce with pickles',            730.00),
(2, 'Fire Storm',                  'Crispy chicken with firestorm sauce and jalapeños',                 600.00),
(2, 'Fillet Burger',               'Simple grilled chicken fillet with lettuce and mayo',               450.00),
(2, 'Stuffed Chicken',             'Stuffed crispy chicken burger with cheese and sauce',               900.00);
GO

-- ─── Wraps (CategoryID = 3) ───────────────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(3, 'Crispy Tender Wrap',  'Crispy chicken tenders with fresh veggies and garlic sauce',    650.00),
(3, 'Nashville Hot Wrap',  'Spicy Nashville hot tenders wrapped with coleslaw and pickles', 700.00),
(3, 'Firestorm Wrap',      'Firestorm chicken with jalapeños and chipotle sauce',            700.00),
(3, 'Fire Crunch Wrap',    'Fire crunch chicken fillet with lettuce and honey mustard',      700.00);
GO

-- ─── Sandwiches (CategoryID = 4) ──────────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(4, 'Grill Chicken Sandwich', 'Grilled chicken breast with fresh lettuce and garlic mayo',   600.00),
(4, 'Beef Steak Sandwich',    'Juicy beef steak with caramelised onions and mushroom sauce', 800.00);
GO

-- ─── Fries (CategoryID = 5) ───────────────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(5, 'Regular Fries',        'Classic crispy salted fries',                                   200.00),
(5, 'Masala Fries',         'Crispy fries tossed in house masala seasoning',                 220.00),
(5, 'Curly Fries',          'Seasoned spiral curly fries',                                   250.00),
(5, 'Waffle Fries',         'Thick waffle-cut fries with dipping sauce',                     300.00),
(5, 'Thick Cut Fries',      'Chunky steak-style thick cut fries',                            200.00),
(5, 'Veggie Fries',         'Lightly seasoned vegetable fries',                              300.00),
(5, 'Mayo Loaded Fries',    'Fries topped with house mayo sauce',                            350.00),
(5, 'Chicken Loaded Fries', 'Fries loaded with crispy chicken pieces and cheese sauce',      600.00),
(5, 'Beef Loaded Fries',    'Fries loaded with smashed beef and special sauce',              750.00);
GO

-- ─── Wings (CategoryID = 6) ───────────────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(6, 'Crispy Wings (5 pcs)',         'Classic crispy bone-in wings',                          380.00),
(6, 'Crispy Wings (10 pcs)',        'Classic crispy bone-in wings — large order',            680.00),
(6, 'Thai Sweet Chilli Wings (5)',  'Wings glazed in sweet Thai chilli sauce',               480.00),
(6, 'Thai Sweet Chilli Wings (10)', 'Wings glazed in sweet Thai chilli sauce — large',      780.00),
(6, 'Korean Gochu Wings (5)',       'Wings in spicy Korean gochujang glaze',                 480.00),
(6, 'Korean Gochu Wings (10)',      'Wings in spicy Korean gochujang glaze — large',        780.00),
(6, 'Honey Buffalo Wings (5)',      'Classic honey buffalo glazed wings',                    480.00),
(6, 'Honey Buffalo Wings (10)',     'Classic honey buffalo glazed wings — large',           780.00),
(6, 'Mango Habanero Wings (5)',     'Sweet mango with habanero heat wings',                  480.00),
(6, 'Mango Habanero Wings (10)',    'Sweet mango with habanero heat wings — large',         780.00),
(6, 'Honey Butter Wings (5)',       'Rich honey butter glazed wings',                        480.00),
(6, 'Honey Butter Wings (10)',      'Rich honey butter glazed wings — large',               780.00),
(6, 'Honey Mustard Wings (5)',      'Tangy honey mustard glazed wings',                      480.00),
(6, 'Honey Mustard Wings (10)',     'Tangy honey mustard glazed wings — large',             780.00);
GO

-- ─── Tenders (CategoryID = 7) ─────────────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(7, 'Crispy Tenders (3 pcs)',        'Classic crispy golden tenders',                        550.00),
(7, 'Crispy Tenders (5 pcs)',        'Classic crispy golden tenders — large',                850.00),
(7, 'Flaming Hot Tenders (3 pcs)',   'Tenders coated in flaming hot seasoning',              650.00),
(7, 'Flaming Hot Tenders (5 pcs)',   'Tenders coated in flaming hot seasoning — large',     850.00),
(7, 'Nashville Hot Tenders (3 pcs)', 'Spicy Nashville-style glazed tenders',                 650.00),
(7, 'Nashville Hot Tenders (5 pcs)', 'Spicy Nashville-style glazed tenders — large',        850.00),
(7, 'Thai Sweet Chilli Tenders (3)', 'Tenders in sweet Thai chilli glaze',                   650.00),
(7, 'Thai Sweet Chilli Tenders (5)', 'Tenders in sweet Thai chilli glaze — large',          1050.00),
(7, 'Honey Buffalo Tenders (3 pcs)', 'Honey buffalo glazed crispy tenders',                  650.00),
(7, 'Honey Buffalo Tenders (5 pcs)', 'Honey buffalo glazed crispy tenders — large',         1050.00),
(7, 'Mango Habanero Tenders (3)',    'Sweet mango habanero glazed tenders',                  650.00),
(7, 'Mango Habanero Tenders (5)',    'Sweet mango habanero glazed tenders — large',         1050.00),
(7, 'Honey Butter Tenders (3 pcs)',  'Rich honey butter glazed tenders',                     650.00),
(7, 'Honey Butter Tenders (5 pcs)',  'Rich honey butter glazed tenders — large',            1050.00);
GO

-- ─── Sides & Extras (CategoryID = 8) ──────────────────────────────────────────
INSERT INTO MenuItems (CategoryID, ItemName, Description, Price) VALUES
(8, 'Beef Sliders (Box of 4)',  'Four mini smashed beef sliders',                            450.00),
(8, 'Fire Storm Onion Rings',   'Crispy onion rings with firestorm seasoning (8 pcs)',       300.00),
(8, 'Onion Rings',              'Classic crispy golden onion rings (8 pcs)',                 300.00),
(8, 'Cheese Sticks (5 pcs)',    'Stretchy mozzarella cheese sticks with dipping sauce',      400.00),
(8, 'Cheetos Cheese Sticks',    'Cheetos-coated crispy cheese sticks',                       450.00),
(8, 'Fish Burger',              'Crispy fish fillet with tartar sauce and coleslaw',         600.00),
(8, 'Fish & Chips',             'Crispy battered fish with thick cut fries',                 600.00),
(8, 'Make It a Meal',           'Add fries + drink to any burger (upgrade)',                 220.00);
GO

-- ─── Test Delivery Person ──────────────────────────────────────────────────────
-- Password = "delivery@123" (SHA-256)
INSERT INTO Users (FullName, PhoneNumber, Password, Address, City, VehicleType, VehicleNumber, Role)
VALUES (
  'Ali Raza',
  '03001234567',
  '135c67ffb9282acbfe5f2a66dcc90f6b60d4d213c213346f08169f69830e8be6',
  '110 B Samanabad Lahore (Near Bay Bakery)',
  'Lahore',
  'Motorcycle',
  'LHR-1234',
  'DeliveryPerson'
);
GO

PRINT 'Grub seed data inserted successfully.';
PRINT 'Categories: 8  |  Menu Items: 66  |  Delivery Person: 1';
PRINT 'Delivery login: phone=03001234567, password=delivery@123';
GO
select * from Categories
where IsActive = 0;
