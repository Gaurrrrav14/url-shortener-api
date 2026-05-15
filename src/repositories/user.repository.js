import pool from '../config/db.js';

/**
 * Create a new user
 * Returns only safe fields (never password_hash)
 */
export async function createUser(email, passwordHash) {
  const query = `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING id, email, created_at;
  `;

  const { rows } = await pool.query(query, [email, passwordHash]);
  return rows[0];
}

/**
 * Find user by email (used internally for authentication)
 * Includes password_hash for password comparison
 */
export async function findByEmail(email) {
  const query = `
    SELECT id, email, password_hash
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}