const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { connectDB } = require('./config/database');
const { initializeFirebaseAdmin } = require('./config/firebaseAdmin');

initializeFirebaseAdmin();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: log every request (method, path, url)
app.use((req, res, next) => {
  console.log('[ROUTE DEBUG]', req.method, 'path:', req.path, 'url:', req.url, 'originalUrl:', req.originalUrl);
  next();
});

// Routes – register award-points on the app so it always matches (avoids router path quirks)
const { requireAuth } = require('./middleware/auth');
const classController = require('./controllers/classController');

app.post('/api/classes/:id/award-points', requireAuth, (req, res, next) => {
  console.log('[ROUTE DEBUG] award-points route HIT, params.id:', req.params.id);
  next();
}, classController.awardPoints);

app.use('/api', require('./routes/index'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  console.log('[ROUTE DEBUG] 404 – no match for', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
