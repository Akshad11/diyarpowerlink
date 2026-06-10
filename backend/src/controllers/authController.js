import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/AdminUser.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Message } from '../models/Message.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@diyarpowerlink.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Always allow env admin override if credentials match
  if (email === ADMIN_EMAIL) {
    let validEnv = false;
    if (ADMIN_PASSWORD_HASH) {
      validEnv = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } else {
      validEnv = password === ADMIN_PASSWORD;
    }
    if (validEnv) {
      const token = jwt.sign({ email, role: 'super' }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token });
    }
  }

  const dbUser = await AdminUser.findOne({ email });
  if (dbUser) {
    const valid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ email, role: dbUser.role }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token });
  }

  if (email !== ADMIN_EMAIL) return res.status(401).json({ error: 'Invalid credentials' });

  let valid = false;
  if (ADMIN_PASSWORD_HASH) {
    valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else {
    valid = password === ADMIN_PASSWORD;
  }

  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ email, role: 'super' }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
};

export const getDashboardSummary = async (_req, res) => {
  try {
    const [products, categories, messages] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Message.countDocuments()
    ]);

    res.json({
      totalProducts: products,
      totalCategories: categories,
      totalMessages: messages,
      recentUpdates: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
