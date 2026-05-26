const router = require('express').Router();
const { getCategories, getMenuItems, getItemsByCategory, searchItems } = require('./menu.controller');

router.get('/categories',        getCategories);
router.get('/items',             getMenuItems);
router.get('/items/search',      searchItems);         // must be before /:categoryId
router.get('/items/:categoryId', getItemsByCategory);

module.exports = router;
