const express = require('express');
require('dotenv').config;
const rateLimit = require('express-rate-limit');

const urlRoutes = require('./routes/urls');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json);

//more strict limiter for write opp
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 requests per window
  message: { error: 'Too many URLs created. Please try again later.' },
  standardHeaders: true,     // sends RateLimit headers in response
  legacyHeaders: false,
});

//less strict for read operations
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

//routes with rate limit
app.use('/api/shorten', createLimiter);
app.use('/api/stats', readLimiter);
app.use('/:slug', readLimiter);

app.use('/', urlRoutes);

app.get('/health', (req, res) => {
  res.json({status : 'ok'});
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});