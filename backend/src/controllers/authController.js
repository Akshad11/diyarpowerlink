import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/AdminUser.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Message } from '../models/Message.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const dbUser = await AdminUser.findOne({ email });
  if (!dbUser) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, dbUser.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ email, role: dbUser.role }, JWT_SECRET, { expiresIn: '12h' });
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
