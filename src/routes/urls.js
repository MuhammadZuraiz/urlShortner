const express = require('express');
const router = express.Router();
const db = require('../db');
const { nanoid } = require('nanoid');
const AppError = require('../utils/AppError');

// Helper — wraps async route handlers so you never forget a try/catch
// Instead of try/catch in every route, you wrap the handler with this.
// Any thrown error gets forwarded to the global error handler automatically.
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// -------------------------------------------------------
// POST /api/shorten
// -------------------------------------------------------
router.post('/api/shorten', catchAsync(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    throw new AppError('URL is required', 400);
  }

  try {
    new URL(url);
  } catch {
    throw new AppError('Invalid URL format', 400);
  }

  const slug = nanoid(7);

  const result = await db.query(
    `INSERT INTO urls (slug, original_url)
     VALUES ($1, $2)
     RETURNING id, slug, original_url, created_at`,
    [slug, url]
  );

  const newUrl = result.rows[0];
  const shortUrl = `${req.protocol}://${req.get('host')}/${newUrl.slug}`;

  res.status(201).json({
    shortUrl,
    slug: newUrl.slug,
    originalUrl: newUrl.original_url,
    createdAt: newUrl.created_at,
  });
}));

// -------------------------------------------------------
// GET /api/stats/:slug
// -------------------------------------------------------
router.get('/api/stats/:slug', catchAsync(async (req, res) => {
  const { slug } = req.params;

  const result = await db.query(
    `SELECT
       slug,
       original_url,
       click_count,
       created_at,
       EXTRACT(DAY FROM NOW() - created_at) AS days_active
     FROM urls
     WHERE slug = $1`,
    [slug]
  );

  if (result.rows.length === 0) {
    throw new AppError('Short URL not found', 404);
  }

  const row = result.rows[0];

  res.json({
    slug: row.slug,
    originalUrl: row.original_url,
    clickCount: row.click_count,
    createdAt: row.created_at,
    daysActive: parseInt(row.days_active),
    clicksPerDay: row.days_active > 0
      ? (row.click_count / row.days_active).toFixed(2)
      : row.click_count,
  });
}));

// -------------------------------------------------------
// GET /:slug
// -------------------------------------------------------
router.get('/:slug', catchAsync(async (req, res) => {
  const { slug } = req.params;

  const result = await db.query(
    `UPDATE urls
     SET click_count = click_count + 1
     WHERE slug = $1
     RETURNING original_url`,
    [slug]
  );

  if (result.rows.length === 0) {
    throw new AppError('Short URL not found', 404);
  }

  res.redirect(302, result.rows[0].original_url);
}));

module.exports = router;