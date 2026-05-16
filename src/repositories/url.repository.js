import pool from '../config/db.js';

// Insert new URL
export async function createUrl(originalUrl, userId = null) {
  const query = `
    INSERT INTO urls (original_url, user_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [originalUrl, userId]);
  return rows[0];
}

// Update short code
export async function updateShortCode(id, shortCode) {
  const query = `
    UPDATE urls
    SET short_code = $1
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [shortCode, id]);
  return rows[0];
}

// Find by short code
export async function findByShortCode(code) {
  const query = `
    SELECT * FROM urls
    WHERE short_code = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [code]);
  return rows[0] || null;
}

// Find all URLs for user
export async function findByUserId(userId) {
  const query = `
    SELECT * FROM urls
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

// Delete URL if owned by user
export async function deleteByCode(code, userId) {
  const query = `
    DELETE FROM urls
    WHERE short_code = $1 AND user_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [code, userId]);
  return rows[0] || null;
}

// Find all URLs for user WITH click count
export async function findByUserIdWithClicks(userId) {
  const query = `
    SELECT 
      urls.id,
      urls.original_url,
      urls.short_code,
      urls.created_at,
      COUNT(clicks.id) AS click_count
    FROM urls
    LEFT JOIN clicks ON clicks.url_id = urls.id
    WHERE urls.user_id = $1
    GROUP BY urls.id
    ORDER BY urls.created_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

// Count clicks for a specific URL
export async function countClicksByUrlId(urlId) {
  const query = `
    SELECT COUNT(*) AS total
    FROM clicks
    WHERE url_id = $1;
  `;
  const { rows } = await pool.query(query, [urlId]);
  return Number(rows[0].total);
}

export async function countClicksLast24hByUrlId(urlId) {
  const query = `
    SELECT COUNT(*) AS count
    FROM clicks
    WHERE url_id = $1
      AND clicked_at > NOW() - INTERVAL '24 hours';
  `;
  const { rows } = await pool.query(query, [urlId]);
  return Number(rows[0].count);
}