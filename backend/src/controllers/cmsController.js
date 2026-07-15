import bcrypt from 'bcryptjs';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { BusinessArea } from '../models/BusinessArea.js';
import { Service } from '../models/Service.js';
import { Partner } from '../models/Partner.js';
import { Message } from '../models/Message.js';
import { AdminUser } from '../models/AdminUser.js';
import { Settings } from '../models/Settings.js';
import { Currency } from '../models/Currency.js';
import { ExchangeRate } from '../models/ExchangeRate.js';
import { sendMail, mailer, SMTP_FROM, CONTACT_TO } from '../services/emailService.js';
import { defaultCategories, defaultBusinessAreas, defaultServices, defaultPartners, defaultProducts } from '../seed/defaults.js';
import { defaultSettings } from '../seed/defaultSettings.js';

// Categories CRUD
export const listCategories = async (_req, res) => {
  res.json(await Category.find().sort({ createdAt: -1 }));
};
export const createCategory = async (req, res) => {
  res.json(await Category.create(req.body));
};
export const updateCategory = async (req, res) => {
  res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }));
};
export const deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// Products CRUD
export const listProducts = async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  for (const product of products) {
    let changed = false;
    if (!product.sku) {
      product.sku = String(product._id);
      changed = true;
    }
    if (!product.barcodeValue) {
      product.barcodeValue = product.sku || String(product._id);
      product.barcodeFormat = 'CODE128';
      changed = true;
    }
    if (changed) await product.save();
  }
  res.json(products);
};
export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  let changed = false;
  if (!product.sku) {
    product.sku = String(product._id);
    changed = true;
  }
  if (!product.barcodeValue) {
    product.barcodeValue = product.sku || String(product._id);
    product.barcodeFormat = 'CODE128';
    changed = true;
  }
  if (changed) await product.save();
  res.json(product);
};
export const createProduct = async (req, res) => {
  const payload = { ...req.body };
  if (payload.price !== undefined) payload.price = Number(payload.price) || 0;
  if (payload.sku !== undefined) payload.sku = String(payload.sku).trim();
  const created = await Product.create(payload);
  if (!created.sku) {
    created.sku = String(created._id);
  }
  created.barcodeValue = created.sku;
  created.barcodeFormat = 'CODE128';
  await created.save();
  res.json(created);
};
export const updateProduct = async (req, res) => {
  const updates = { ...req.body };
  if (updates.price !== undefined) updates.price = Number(updates.price) || 0;
  if (updates.sku !== undefined) updates.sku = String(updates.sku).trim();
  if (updates.sku) {
    updates.barcodeValue = updates.sku;
    updates.barcodeFormat = 'CODE128';
  }
  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json(updated);
};
export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// Business Areas CRUD
export const listBusinessAreas = async (_req, res) => {
  res.json(await BusinessArea.find().sort({ createdAt: -1 }));
};
export const createBusinessArea = async (req, res) => {
  res.json(await BusinessArea.create(req.body));
};
export const updateBusinessArea = async (req, res) => {
  res.json(await BusinessArea.findByIdAndUpdate(req.params.id, req.body, { new: true }));
};
export const deleteBusinessArea = async (req, res) => {
  await BusinessArea.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// Services CRUD
export const listServices = async (_req, res) => {
  res.json(await Service.find().sort({ createdAt: -1 }));
};
export const createService = async (req, res) => {
  res.json(await Service.create(req.body));
};
export const updateService = async (req, res) => {
  res.json(await Service.findByIdAndUpdate(req.params.id, req.body, { new: true }));
};
export const deleteService = async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// Partners CRUD
export const listPartners = async (_req, res) => {
  res.json(await Partner.find().sort({ createdAt: -1 }));
};
export const createPartner = async (req, res) => {
  res.json(await Partner.create(req.body));
};
export const updatePartner = async (req, res) => {
  res.json(await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true }));
};
export const deletePartner = async (req, res) => {
  await Partner.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// Messages / Public Contact form CRUD
export const listMessages = async (_req, res) => {
  res.json(await Message.find().sort({ createdAt: -1 }));
};
export const patchMessage = async (req, res) => {
  res.json(await Message.findByIdAndUpdate(req.params.id, req.body, { new: true }));
};
export const deleteMessage = async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
export const createPublicMessage = async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required' });
  const saved = await Message.create(req.body);

  const settings = await Settings.findOne();
  const recipient = settings?.contactRecipient || CONTACT_TO;

  if (mailer && recipient) {
    const subject = req.body.subject || 'New Contact Form Submission';
    const phone = req.body.phone || 'N/A';
    const lines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Subject: ${subject}`,
      '',
      'Message:',
      req.body.message || ''
    ];

    sendMail({
      to: recipient,
      replyTo: email,
      subject: `[Diyar Power Link] ${subject}`,
      html: lines.join('<br>')
    }).catch((err) => console.error('Email send failed', err));
  }

  res.json(saved);
};

// Admin Users CRUD
export const listAdminUsers = async (_req, res) => {
  const users = await AdminUser.find().sort({ createdAt: -1 }).select('-passwordHash');
  res.json(users);
};
export const createAdminUser = async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const exists = await AdminUser.findOne({ email });
  if (exists) return res.status(400).json({ error: 'Email already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const created = await AdminUser.create({ name: name || '', email, passwordHash, role: role || 'admin' });
  res.json({ _id: created._id, name: created.name, email: created.email, role: created.role, createdAt: created.createdAt });
};
export const updateAdminUser = async (req, res) => {
  const { name, email, password, role } = req.body || {};
  const update = {};
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email;
  if (role !== undefined) update.role = role;
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  const updated = await AdminUser.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
  res.json(updated);
};
export const deleteAdminUser = async (req, res) => {
  await AdminUser.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// Seeding DB
export const seedDefaultsData = async (_req, res) => {
  try {
    await seedDefaults();
    const counts = await Promise.all([
      Category.countDocuments(),
      BusinessArea.countDocuments(),
      Service.countDocuments(),
      Partner.countDocuments(),
      Product.countDocuments()
    ]);
    res.json({
      ok: true,
      counts: {
        categories: counts[0],
        businessAreas: counts[1],
        services: counts[2],
        partners: counts[3],
        products: counts[4]
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Seed failed' });
  }
};

export async function seedDefaults() {
  const [catCount, areaCount, serviceCount, partnerCount, productCount, settingsCount, adminCount, currencyCount, rateCount] = await Promise.all([
    Category.countDocuments(),
    BusinessArea.countDocuments(),
    Service.countDocuments(),
    Partner.countDocuments(),
    Product.countDocuments(),
    Settings.countDocuments(),
    AdminUser.countDocuments(),
    Currency.countDocuments(),
    ExchangeRate.countDocuments()
  ]);

  if (catCount === 0) await Category.insertMany(defaultCategories);
  if (areaCount === 0) await BusinessArea.insertMany(defaultBusinessAreas);
  if (serviceCount === 0) await Service.insertMany(defaultServices);
  if (partnerCount === 0) await Partner.insertMany(defaultPartners);
  if (productCount === 0) await Product.insertMany(defaultProducts);
  if (settingsCount === 0) {
    await Settings.create(defaultSettings);
  } else {
    const existing = await Settings.findOne();
    if (existing) {
      await Settings.findByIdAndUpdate(existing._id, defaultSettings, { new: true });
    }
  }

  if (currencyCount === 0) {
    await Currency.insertMany([
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', isBase: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', isBase: false },
      { code: 'EUR', name: 'Euro', symbol: '€', isBase: false },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', isBase: false }
    ]);
  }

  if (rateCount === 0) {
    await ExchangeRate.insertMany([
      { from: 'USD', to: 'INR', rate: 83.50 },
      { from: 'EUR', to: 'INR', rate: 90.00 },
      { from: 'AED', to: 'INR', rate: 22.70 },
      { from: 'INR', to: 'INR', rate: 1.00 }
    ]);
  }
}
