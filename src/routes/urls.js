const express = require('express');
const router = express.Router();
const db = require('../db');
const { nanoid, nanoid } = require('nanoid');

router.post('/api/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  
  //verify if the format is right
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  //do the shortening using nanoid
  try {
    const slug = nanoid(7);

    //we insert into db and return the inserted back values using returning
    const result = await db.query(
      `INSERT INTO urls (slug, original_url)
      VALUES ($1, $2)
      RETURNING id, slug, original_url, created_at`,
      [slug, url]
    );

    const newUrl = result.rows[0];

    //our full short URL
    const shortUrl = `${req.protocol}://${req.get('host')}/${newUrl.slug}`;

    return res.status(201).json({
      shortUrl,
      slug: newUrl.slug,
      originalUrl: newUrl.original_url,
      createdAt: newUrl.created_at,
    });

  } catch (err) {
    console.error('Error shortening URL:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
    try {
      const result = await db.query(
        `UPDATE urls
        SET click_count = click_count + 1
        WHERE slug = $1
        RETURNING original_url`,
        [slug]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Short URL not found' });

      const { original_url } = result.rows[0];

      return res.redirect(302, original_url);
      
    } catch(err) {
      console.error('Error redirecting:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;