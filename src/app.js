const express = require('express');
const rateLimit = require('express-rate-limit');

const config = require('./config/env'); // validation runs here at startup
const urlRoutes = require('./routes/urls');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

// --- Rate limiters ---
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many URLs created. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/shorten', createLimiter);
app.use('/api/stats', readLimiter);
app.use('/:slug', readLimiter);

// --- Routes ---
app.use('/', urlRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: config.nodeEnv });
});

// --- 404 handler ---
// Catches any request that didn't match a route above
app.use((req, res, next) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// --- Global error handler ---
// MUST be registered last, after all routes
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port} [${config.nodeEnv}]`);
});