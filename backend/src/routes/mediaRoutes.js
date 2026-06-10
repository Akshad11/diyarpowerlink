import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadsDir } from '../services/migrationService.js';
import {
  listMedia,
  uploadMedia,
  deleteMedia,
  triggerImportAssets,
  triggerNormalizeUrls,
  triggerAutoAssignImages,
  triggerMigrateToCloudinary
} from '../controllers/mediaController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

router.get('/', requireAuth, listMedia);
router.post('/', requireAuth, upload.single('file'), uploadMedia);
router.post('/import-assets', requireAuth, triggerImportAssets);
router.post('/normalize', requireAuth, triggerNormalizeUrls);
router.post('/auto-assign', requireAuth, triggerAutoAssignImages);
router.post('/migrate', requireAuth, triggerMigrateToCloudinary);
router.delete('/:id', requireAuth, deleteMedia);

export default router;
