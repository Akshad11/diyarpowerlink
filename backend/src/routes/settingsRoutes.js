import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', requireAuth, updateSettings);

export default router;
