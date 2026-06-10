import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { Media } from '../models/Media.js';
import { Category } from '../models/Category.js';
import { BusinessArea } from '../models/BusinessArea.js';
import { Partner } from '../models/Partner.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { useCloudinary, cloudinary, CLOUDINARY_FOLDER, PUBLIC_SITE_URL, BACKEND_PUBLIC_URL } from './cloudinaryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir = process.env.UPLOAD_DIR
  ? process.env.UPLOAD_DIR
  : (process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', '..', 'uploads'));

export const importAssets = async () => {
  const assetsRoot = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'assets');
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif']);
  let created = 0;
  let uploaded = 0;

  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!allowed.has(ext)) continue;
      const stat = await fs.stat(full);
      const existing = await Media.findOne({ filename: entry.name, size: stat.size });
      if (existing) continue;
      if (useCloudinary) {
        try {
          const cloud = await cloudinary.uploader.upload(full, {
            folder: CLOUDINARY_FOLDER,
            resource_type: 'image'
          });
          await Media.create({
            filename: entry.name,
            url: cloud.secure_url,
            mimetype: `image/${ext.replace('.', '')}`,
            size: stat.size
          });
          created += 1;
          uploaded += 1;
        } catch (err) {
          // Skip failed uploads
        }
      } else {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const dest = path.join(uploadsDir, unique);
        // Ensure uploadsDir exists
        await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});
        await fs.copyFile(full, dest);
        const url = `/uploads/${unique}`;
        await Media.create({ filename: entry.name, url, mimetype: `image/${ext.replace('.', '')}`, size: stat.size });
        created += 1;
      }
    }
  };

  await walk(assetsRoot);
  return { created, uploaded };
};

export const normalizeUrls = async () => {
  if (!BACKEND_PUBLIC_URL) {
    throw new Error('BACKEND_PUBLIC_URL is required');
  }

  const replaceBase = (value) => {
    if (!value || typeof value !== 'string') return value;
    if (value.startsWith('http://localhost:4000')) {
      return value.replace('http://localhost:4000', BACKEND_PUBLIC_URL);
    }
    if (value.startsWith('http://127.0.0.1:4000')) {
      return value.replace('http://127.0.0.1:4000', BACKEND_PUBLIC_URL);
    }
    return value;
  };

  let updated = 0;

  const settings = await Settings.findOne();
  if (settings) {
    if (settings.logo) settings.logo = replaceBase(settings.logo);
    if (settings.home) {
      if (settings.home.heroBackgroundImage) settings.home.heroBackgroundImage = replaceBase(settings.home.heroBackgroundImage);
      if (settings.home.whoImage) settings.home.whoImage = replaceBase(settings.home.whoImage);
    }
    if (settings.about) {
      if (settings.about.heroImage) settings.about.heroImage = replaceBase(settings.about.heroImage);
      if (settings.about.image) settings.about.image = replaceBase(settings.about.image);
    }
    await settings.save();
  }

  const normalizeDocField = async (Model, field) => {
    const docs = await Model.find();
    for (const doc of docs) {
      const current = doc[field];
      const next = replaceBase(current);
      if (current !== next) {
        doc[field] = next;
        await doc.save();
        updated += 1;
      }
    }
  };

  await normalizeDocField(Category, 'image');
  await normalizeDocField(BusinessArea, 'image');
  await normalizeDocField(Partner, 'logo');

  const products = await Product.find();
  for (const product of products) {
    let changed = false;
    if (Array.isArray(product.images) && product.images.length) {
      const next = product.images.map(replaceBase);
      if (next.join('|') !== product.images.join('|')) {
        product.images = next;
        changed = true;
      }
    }
    if (product.image) {
      const nextImage = replaceBase(product.image);
      if (nextImage !== product.image) {
        product.image = nextImage;
        changed = true;
      }
    }
    if (changed) {
      await product.save();
      updated += 1;
    }
  }

  return updated;
};

export const autoAssignImages = async () => {
  const media = await Media.find();
  const byName = media.map((m) => ({
    name: (m.filename || '').toLowerCase(),
    url: m.url
  }));

  const findByKeywords = (keywords = []) => {
    const hits = byName.find((m) => keywords.some((k) => m.name.includes(k)));
    return hits?.url || '';
  };

  let updated = 0;

  const settings = await Settings.findOne();
  if (settings) {
    const logoUrl =
      findByKeywords(['diyar-logo-wide', 'diyar-logo', 'diyar']) ||
      settings.logo;
    if (logoUrl && logoUrl !== settings.logo) {
      settings.logo = logoUrl;
      updated += 1;
    }
    await settings.save();
  }

  const categoryMap = {
    'IT Solutions': ['it solution', 'it-solutions', 'it_solutions', 'it.png', 'it solution.png'],
    'Paper Products': ['paper products', 'paper-products', 'paperproducts'],
    'Medical Supplies': ['medical', 'medical supplies', 'hospital', 'pcr', 'ppe'],
    'Packaging Materials': ['packaging', 'strapping', 'stretch', 'packaging materials', 'image29']
  };

  const partnerMap = {
    Microsoft: ['microsoft'],
    Adobe: ['adobe'],
    Autodesk: ['autodesk'],
    Kaspersky: ['kaspersky'],
    ESET: ['eset'],
    Norton: ['norton']
  };

  const isUploadsUrl = (value) => typeof value === 'string' && value.startsWith('/uploads/');

  const categories = await Category.find();
  for (const cat of categories) {
    const keywords = categoryMap[cat.name] || [cat.name.toLowerCase()];
    const url = findByKeywords(keywords);
    if (url && (cat.image !== url) && (isUploadsUrl(cat.image) || !cat.image)) {
      cat.image = url;
      await cat.save();
      updated += 1;
    }
  }

  const areas = await BusinessArea.find();
  for (const area of areas) {
    const keywords = categoryMap[area.title] || [area.title.toLowerCase()];
    const url = findByKeywords(keywords);
    if (url && (area.image !== url) && (isUploadsUrl(area.image) || !area.image)) {
      area.image = url;
      await area.save();
      updated += 1;
    }
  }

  const partners = await Partner.find();
  for (const partner of partners) {
    const keywords = partnerMap[partner.name] || [partner.name.toLowerCase()];
    const url = findByKeywords(keywords);
    if (url && (partner.logo !== url) && (isUploadsUrl(partner.logo) || !partner.logo)) {
      partner.logo = url;
      await partner.save();
      updated += 1;
    }
  }

  const products = await Product.find();
  for (const product of products) {
    const keywords = [product.name.toLowerCase(), product.category?.toLowerCase() || ''];
    const url = findByKeywords(keywords);
    const hasImages = Array.isArray(product.images) && product.images.length > 0;
    const allUploads = hasImages ? product.images.every(isUploadsUrl) : false;
    if (url && (!hasImages || allUploads)) {
      product.images = [url];
      await product.save();
      updated += 1;
    }
  }

  return updated;
};

export const migrateToCloudinary = async () => {
  if (!useCloudinary) {
    throw new Error('Cloudinary not configured');
  }
  if (!PUBLIC_SITE_URL || !BACKEND_PUBLIC_URL) {
    throw new Error('PUBLIC_SITE_URL and BACKEND_PUBLIC_URL are required');
  }

  let updated = 0;
  const failures = [];
  const assetsRoot = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'assets');
  const assetMap = new Map();
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif']);

  const buildAssetMap = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await buildAssetMap(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!allowed.has(ext)) continue;
      if (!assetMap.has(entry.name)) {
        assetMap.set(entry.name, full);
      }
    }
  };

  try {
    await buildAssetMap(assetsRoot);
  } catch {
    // ignore if assets folder missing
  }

  const mediaDocs = await Media.find();
  const mediaCloudMap = new Map();
  for (const doc of mediaDocs) {
    if (doc.url && doc.url.includes('res.cloudinary.com') && doc.filename) {
      mediaCloudMap.set(doc.filename, doc.url);
    }
  }

  const resolveRemote = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/assets')) return `${PUBLIC_SITE_URL}${url}`;
    if (url.startsWith('/uploads')) return `${BACKEND_PUBLIC_URL}${url}`;
    return '';
  };

  const shouldSkip = (url) => !url || url.includes('res.cloudinary.com');

  const uploadUrl = async (url) => {
    const remote = resolveRemote(url);
    if (!remote) return '';
    const uploaded = await cloudinary.uploader.upload(remote, {
      folder: CLOUDINARY_FOLDER,
      resource_type: 'image'
    });
    return uploaded.secure_url || '';
  };

  const uploadLocalFile = async (filePath) => {
    const uploaded = await cloudinary.uploader.upload(filePath, {
      folder: CLOUDINARY_FOLDER,
      resource_type: 'image'
    });
    return uploaded.secure_url || '';
  };

  const pickCloudFromFilename = (value) => {
    if (!value || typeof value !== 'string') return '';
    const name = value.split('/').pop() || '';
    return mediaCloudMap.get(name) || '';
  };

  const migrateField = async (doc, field) => {
    const value = doc[field];
    if (shouldSkip(value)) return false;
    try {
      const byName = pickCloudFromFilename(value);
      if (byName) {
        doc[field] = byName;
        updated += 1;
        return true;
      }
      const newUrl = await uploadUrl(value);
      if (newUrl) {
        doc[field] = newUrl;
        updated += 1;
        return true;
      }
    } catch (err) {
      failures.push({ field, value, error: err?.message || 'upload failed' });
    }
    return false;
  };

  const migrateArrayField = async (doc, field) => {
    const arr = doc[field];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    let changed = false;
    const next = [];
    for (const item of arr) {
      if (shouldSkip(item)) {
        next.push(item);
        continue;
      }
      try {
        const byName = pickCloudFromFilename(item);
        if (byName) {
          next.push(byName);
          updated += 1;
          changed = true;
          continue;
        }
        const newUrl = await uploadUrl(item);
        next.push(newUrl || item);
        if (newUrl) {
          updated += 1;
          changed = true;
        }
      } catch (err) {
        failures.push({ field, value: item, error: err?.message || 'upload failed' });
        next.push(item);
      }
    }
    if (changed) doc[field] = next;
    return changed;
  };

  // Media library items
  for (const doc of mediaDocs) {
    if (shouldSkip(doc.url)) continue;
    const byName = mediaCloudMap.get(doc.filename || '');
    if (byName) {
      doc.url = byName;
      await doc.save();
      updated += 1;
      continue;
    }
    try {
      let newUrl = '';
      if (doc.url && doc.url.startsWith('/assets')) {
        const local = assetMap.get(doc.filename);
        newUrl = local ? await uploadLocalFile(local) : await uploadUrl(doc.url);
      } else if (doc.url && doc.url.startsWith('/uploads')) {
        const local = assetMap.get(doc.filename);
        if (local) {
          newUrl = await uploadLocalFile(local);
        } else {
          newUrl = await uploadUrl(doc.url);
        }
      } else {
        newUrl = await uploadUrl(doc.url);
      }
      if (newUrl) {
        doc.url = newUrl;
        await doc.save();
        updated += 1;
      }
    } catch (err) {
      failures.push({ field: 'media.url', value: doc.url, error: err?.message || 'upload failed' });
    }
  }

  // Settings
  const settings = await Settings.findOne();
  if (settings) {
    let changed = false;
    changed = (await migrateField(settings, 'logo')) || changed;
    if (settings.home) {
      changed = (await migrateField(settings.home, 'heroBackgroundImage')) || changed;
      changed = (await migrateField(settings.home, 'whoImage')) || changed;
    }
    if (settings.about) {
      changed = (await migrateField(settings.about, 'heroImage')) || changed;
      changed = (await migrateField(settings.about, 'image')) || changed;
    }
    if (changed) await settings.save();
  }

  // Categories
  const categories = await Category.find();
  for (const cat of categories) {
    const changed = await migrateField(cat, 'image');
    if (changed) await cat.save();
  }

  // Business Areas
  const areas = await BusinessArea.find();
  for (const area of areas) {
    const changed = await migrateField(area, 'image');
    if (changed) await area.save();
  }

  // Partners
  const partners = await Partner.find();
  for (const partner of partners) {
    const changed = await migrateField(partner, 'logo');
    if (changed) await partner.save();
  }

  // Products
  const products = await Product.find();
  for (const product of products) {
    let changed = false;
    changed = (await migrateArrayField(product, 'images')) || changed;
    if (changed) await product.save();
  }

  return { updated, failures };
};
