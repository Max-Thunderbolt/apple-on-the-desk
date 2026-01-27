const express = require('express');
const router = express.Router();

// Import route modules
// const exampleRoutes = require('./example');

// Mount routes
// router.use('/example', exampleRoutes);

// API root endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'API is running',
    version: '1.0.0'
  });
});

module.exports = router;
