import * as bcrypt from 'bcrypt';

/**
 * Hash a plain text password using bcrypt
 * Uses 10 rounds (industry standard: secure + performant)
 *
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password with salt
 *
 * @example
 * const hashed = await hashPassword("Password123!");
 * Returns: "\$2b$10$N9qo8uLO...fzqy"
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // 2^10 = 1024 iterations
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare plain text password with hashed password
 * Used during login to verify credentials
 *
 * @param password - Plain text password from login form
 * @param hash - Hashed password from database
 * @returns Promise<boolean> - True if passwords match
 *
 * @example
 * const isValid = await comparePassword("Password123!", storedHash);
 * if (isValid) { // allow login }
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
