const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const pointsCategoryController = require('../controllers/pointsCategoryController');
const shopItemsController = require('../controllers/shopItemsController');
// Import route modules
// const exampleRoutes = require('./example');

// Mount routes
// router.use('/example', exampleRoutes);

// CLASSES ROUTES
router.get('/classes', classController.getAllClasses);
router.get('/classes/names', classController.getClassNames);
router.get('/classes/:id', classController.getClassById);
router.post('/classes', classController.createClass);
router.put('/classes/:id', classController.updateClass);
router.delete('/classes/:id', classController.deleteClass);

// POINTS CATEGORIES ROUTES
router.get('/points-categories', pointsCategoryController.getAllPointsCategories);

// SHOP ITEMS ROUTES
router.get('/shop-items', shopItemsController.getShopItems);

// API root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    version: '1.0.0'
  });
});

module.exports = router;
