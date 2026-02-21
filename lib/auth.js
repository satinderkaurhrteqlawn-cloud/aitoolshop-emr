import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'discount_on_tools_secret_key_2025';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'parwal111@gmail.com';

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function isAdmin(email) {
  return email === ADMIN_EMAIL;
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
