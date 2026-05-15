import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { createUser, findByEmail } from '../repositories/user.repository.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';
// Precomputed dummy hash (for timing attack mitigation)
const DUMMY_HASH =
  '$2a$10$7QJ9gF8lVq7dY6Z7n3G7sO7Q7QJ9gF8lVq7dY6Z7n3G7sO7Q7QJ9g';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function register(email, password) {
  try {
    registerSchema.parse({ email, password });
  } catch (err) {
    throw err; // let global handler process ZodError
  }

  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return createUser(email, passwordHash);
}

export async function login(email, password) {
  try {
    loginSchema.parse({ email, password });
  } catch (err) {
    throw err;
  }

  const user = await findByEmail(email);

  const hashToCompare = user ? user.password_hash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token };
}