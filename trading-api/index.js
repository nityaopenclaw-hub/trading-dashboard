require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { startScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
app.listen(PORT, () => {
  console.log(`[server] Trading API running on http://localhost:${PORT}`);
  console.log(`[server] Auth: Bearer ${process.env.API_SECRET || 'trading-dev-secret'}`);
  startScheduler();
});

module.exports = app;
