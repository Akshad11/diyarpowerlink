import { Media } from '../models/Media.js';
import { useCloudinary, cloudinary, CLOUDINARY_FOLDER } from '../services/cloudinaryService.js';
import { importAssets, normalizeUrls, autoAssignImages, migrateToCloudinary } from '../services/migrationService.js';

export const listMedia = async (_req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadMedia = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'File required' });

  if (useCloudinary) {
    try {
      const uploaded = await cloudinary.uploader.upload(file.path, {
        folder: CLOUDINARY_FOLDER,
        resource_type: 'image'
      });
      const doc = await Media.create({
        filename: file.originalname,
        url: uploaded.secure_url,
        mimetype: file.mimetype,
        size: file.size
      });
      return res.json(doc);
    } catch (err) {
      return res.status(500).json({ error: 'Cloud upload failed' });
    }
  }

  const url = `/uploads/${file.filename}`;
  const doc = await Media.create({ filename: file.originalname, url, mimetype: file.mimetype, size: file.size });
  res.json(doc);
};

export const deleteMedia = async (req, res) => {
  try {
    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const triggerImportAssets = async (_req, res) => {
  try {
    const result = await importAssets();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import assets' });
  }
};

export const triggerNormalizeUrls = async (_req, res) => {
  try {
    const updated = await normalizeUrls();
    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const triggerAutoAssignImages = async (_req, res) => {
  try {
    const updated = await autoAssignImages();
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const triggerMigrateToCloudinary = async (_req, res) => {
  try {
    const result = await migrateToCloudinary();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
