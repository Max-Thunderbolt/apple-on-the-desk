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
router.put('/classes/:id/students', classController.updateStudentPoints);
router.post('/classes/:id/award-points', classController.awardPoints);
router.delete('/classes/:id', classController.deleteClass);

// GROUPING ROUTES
router.post('/classes/:id/generate-groups', classController.generateGroupsForClass);
router.get('/classes/:id/groups', classController.getGroups);
router.put('/classes/:id/clear-groups', classController.clearGroupsForClass);
router.put('/classes/:id/students/:studentId/constraints', classController.updateStudentConstraints);

// POINTS CATEGORIES ROUTES
router.get('/points-categories', pointsCategoryController.getAllPointsCategories);
router.post('/points-categories', pointsCategoryController.createPointsCategory);
router.put('/points-categories/:id', pointsCategoryController.updatePointsCategory);
router.delete('/points-categories/:id', pointsCategoryController.deletePointsCategory);

// SHOP ITEMS ROUTES
router.get('/shop-items', shopItemsController.getShopItems);
router.post('/shop-items', shopItemsController.createShopItem);
router.put('/shop-items/:id', shopItemsController.updateShopItem);
router.delete('/shop-items/:id', shopItemsController.deleteShopItem);

// API root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    version: '1.0.0'
  });
});

module.exports = router;
